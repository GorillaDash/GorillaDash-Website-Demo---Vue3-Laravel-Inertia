import { computed, inject, readonly, ref, shallowRef } from 'vue'
import type { ApolloClient } from '@apollo/client/core'
import {
  AddFoodMenuItemToShoppingCartDocument,
  DeleteFoodMenuItemFromShoppingCartDocument,
  GetFoodShoppingCartDocument,
  SubmitFoodShoppingCartDocument,
  type GetFoodShoppingCartQuery
} from '@/api/foodCart.generated'
import { APOLLO_CLIENT } from '@/composables/useQuery'

/**
 * The visitor's online order, held in Gorilla Dash's food shopping cart.
 *
 * Gorilla Dash keys a cart by a session id the website makes up, and fixes the cart
 * to the tribe it was first added from. So the site keeps two things in the browser
 * (the session id and the chosen cafe) and starts a fresh session whenever the cafe
 * changes. Everything else — lines, modifiers, prices and tax — is read back from
 * Gorilla Dash after every change. Module scope so the header badge, menu and order
 * page share one cart; only ever mutated in the browser.
 */
export type CartLine = NonNullable<
  NonNullable<GetFoodShoppingCartQuery['foodShoppingCart']>['foodShoppingCartItems']
>[number]

export type ModifierSelection = { groupId: number; modifierId: number }

const SESSION_KEY = 'jt-cart-session'
const CAFE_KEY = 'jt-order-cafe'

const sessionId = ref('')
const cafeSlug = ref<string | null>(null)
const lines = shallowRef<CartLine[]>([])
const busy = ref(false)
/** True once the saved cart has been read back, so a cafe switch can warn about items in it. */
const loaded = ref(false)
let client: ApolloClient | null = null
let initialised = false

const storage = {
  get: (key: string): string | null => {
    try {
      return localStorage.getItem(key)
    } catch {
      return null
    }
  },
  set: (key: string, value: string | null): void => {
    try {
      if (value === null) {
        localStorage.removeItem(key)
      } else {
        localStorage.setItem(key, value)
      }
    } catch {
      // Blocked storage: the cart still works until the tab closes.
    }
  }
}

const newSessionId = (): string =>
  `jt-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`

const startSession = (): void => {
  sessionId.value = newSessionId()
  storage.set(SESSION_KEY, sessionId.value)
  lines.value = []
  // A brand-new session has nothing in it, so there is nothing left to load.
  loaded.value = true
}

const refresh = async (): Promise<void> => {
  if (!client || !sessionId.value || !cafeSlug.value) {
    lines.value = []
    loaded.value = true
    return
  }

  // A slow response for a session or cafe the visitor has since switched away from
  // must not overwrite the new, empty cart.
  const requestedSession = sessionId.value
  const requestedCafe = cafeSlug.value

  try {
    const { data } = await client.query({
      query: GetFoodShoppingCartDocument,
      variables: { sessionId: requestedSession, tribeSlug: requestedCafe },
      fetchPolicy: 'network-only'
    })
    if (requestedSession === sessionId.value && requestedCafe === cafeSlug.value) {
      lines.value = [...(data?.foodShoppingCart?.foodShoppingCartItems ?? [])]
    }
  } catch {
    // No open cart for this session yet.
    if (requestedSession === sessionId.value) {
      lines.value = []
    }
  } finally {
    loaded.value = true
  }
}

export function useCart() {
  // Browser only: under SSR the Apollo client belongs to one request.
  const injected = inject(APOLLO_CLIENT, null)
  if (injected && !client && typeof window !== 'undefined') {
    client = injected
  }

  /**
   * Load the saved session and cart. `preferredCafe` only fills an empty choice,
   * unless `explicit` (the visitor followed an "Order from this cafe" link) and the
   * current cart is empty, in which case it switches.
   */
  const init = async (preferredCafe?: string | null, explicit = false): Promise<void> => {
    if (typeof window === 'undefined') {
      return
    }

    if (!initialised) {
      initialised = true
      sessionId.value = storage.get(SESSION_KEY) ?? ''
      cafeSlug.value = storage.get(CAFE_KEY)
      if (!sessionId.value) {
        startSession()
      }
    }

    if (!cafeSlug.value && preferredCafe) {
      setCafe(preferredCafe)
      return
    }

    await refresh()

    if (explicit && preferredCafe && preferredCafe !== cafeSlug.value && lines.value.length === 0) {
      setCafe(preferredCafe)
    }
  }

  /** Choose the cafe to order from. A cart belongs to one tribe, so switching starts a new one. */
  const setCafe = (slug: string): void => {
    if (slug === cafeSlug.value) {
      return
    }
    cafeSlug.value = slug
    storage.set(CAFE_KEY, slug)
    startSession()
  }

  /** Forget a saved cafe that no longer takes orders (closed, or never a trading tribe). */
  const clearCafe = (): void => {
    cafeSlug.value = null
    storage.set(CAFE_KEY, null)
    startSession()
  }

  const add = async (item: {
    listItemId: number
    menuItemId: number
    quantity: number
    modifiers: ModifierSelection[]
  }): Promise<void> => {
    if (!client || !cafeSlug.value) {
      throw new Error('Choose a cafe before adding to your order')
    }

    busy.value = true
    try {
      await client.mutate({
        mutation: AddFoodMenuItemToShoppingCartDocument,
        variables: {
          tribeSlug: cafeSlug.value,
          sessionId: sessionId.value,
          foodItem: JSON.stringify({
            food_menu_list_id: item.listItemId,
            food_menu_item_id: item.menuItemId,
            quantity: item.quantity,
            // Gorilla Dash prices a modifier by its own quantity, not the line's, so a
            // modifier on two bowls is sent as two.
            modifiers: item.modifiers.map((modifier) => ({
              food_modifier_group_id: modifier.groupId,
              food_modifier_id: modifier.modifierId,
              quantity: item.quantity
            }))
          })
        }
      })
      await refresh()
    } finally {
      busy.value = false
    }
  }

  const remove = async (cartItemId: number): Promise<void> => {
    if (!client) {
      return
    }
    busy.value = true
    try {
      await client.mutate({
        mutation: DeleteFoodMenuItemFromShoppingCartDocument,
        variables: { tribeSlug: cafeSlug.value, sessionId: sessionId.value, cartItemId }
      })
      await refresh()
    } finally {
      busy.value = false
    }
  }

  /**
   * Place the order as pickup. With no payment provider on the tribe Gorilla Dash
   * creates the order and returns empty Stripe values, which the demo treats as
   * pay at pickup. When the cafe does have Stripe keys Gorilla Dash returns a payment
   * client secret instead; the demo has no card form, so it reports that and leaves
   * the cart as it is. Throws when Gorilla Dash rejects the order.
   */
  const checkout = async (details: {
    firstName: string
    lastName: string
    email: string
    phone: string
    date: string
    time: string
    comments: string
  }): Promise<'placed' | 'payment-required'> => {
    if (!client || !cafeSlug.value) {
      throw new Error('Choose a cafe before checking out')
    }
    busy.value = true
    try {
      const { data } = await client.mutate({
        mutation: SubmitFoodShoppingCartDocument,
        variables: {
          tribeSlug: cafeSlug.value,
          sessionId: sessionId.value,
          customer: {
            first_name: details.firstName,
            last_name: details.lastName,
            email: details.email,
            phone: details.phone,
            country: 'US'
          },
          deliveryDate: details.date,
          deliveryTime: details.time,
          comments: details.comments || null
        }
      })
      const [, clientSecret] = data?.submitFoodShoppingCart ?? []
      if (clientSecret) {
        return 'payment-required'
      }
      startSession()

      return 'placed'
    } finally {
      busy.value = false
    }
  }

  const count = computed(() => lines.value.reduce((total, line) => total + (line.quantity ?? 0), 0))
  const subTotal = computed(() =>
    lines.value.reduce((total, line) => total + (line.sub_total ?? 0), 0)
  )
  const tax = computed(() => lines.value.reduce((total, line) => total + (line.tax ?? 0), 0))
  const total = computed(() => lines.value.reduce((total, line) => total + (line.total ?? 0), 0))

  return {
    sessionId: readonly(sessionId),
    cafeSlug: readonly(cafeSlug),
    lines,
    busy: readonly(busy),
    loaded: readonly(loaded),
    count,
    subTotal,
    tax,
    total,
    init,
    setCafe,
    clearCafe,
    add,
    remove,
    refresh,
    checkout
  }
}
