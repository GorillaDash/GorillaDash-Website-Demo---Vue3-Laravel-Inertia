/**
 * Mock store locations for the "Choose your Acme Diner" finder dialog.
 * Replace with live data (GraphQL) once the locations API is wired up.
 */

export type StoreLocation = {
  id: string
  name: string
  /** Distance from the user in miles (mock; computed server-side later). */
  distanceMi: number
  addressLine1: string
  addressLine2: string
  lat: number
  lng: number
}
