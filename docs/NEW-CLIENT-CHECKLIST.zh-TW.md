# 新客戶開站 Checklist(繁中版)

> English version: [NEW-CLIENT-CHECKLIST.md](NEW-CLIENT-CHECKLIST.md)。兩份內容同步維護,改一份請同步改另一份。

新客戶網站除了 clone 這個 repo 以外需要的所有東西。repo 端的改名只要一個指令;
其餘大多在 repo 看不到的系統裡(GD CMS、Tolgee、GCP、Cloudflare),所以逐項打勾確認。

## 1. Repo

- [ ] 從 template 建立客戶 repo 並 clone:
      `gh repo create GorillaDash/<Client>-inertiajs --private --template=GorillaDash/gd-client-inertia-starter --clone`
- [ ] 改名占位品牌:
      `bin/new-client.sh --slug <slug> --name "<Display Name>" --domain <domain>`
- [ ] 確認基準仍是綠的:`composer setup && composer ci:check`;把改名 commit + push。
- [ ] `.env.example`:確認 `VITE_GCS_STATIC_URL` 結尾是這個客戶的 GCS prefix——
      `static/clients/<camelCaseSlug>_`(bucket 與命名規則見
      [§4 · 靜態資產](#4-靜態資產))。**這是 build-time 值**——Vite 在
      `deploy/Dockerfile` 內從 `.env.example` 把它 inline 進 bundle;k8s `config.env`
      裡的那份只是備忘紀錄。
- [ ] `package.json` → `static:upload` 指向同一個 GCS prefix。順手 grep 一次有沒有
      別的 prefix 殘留:`bin/new-client.sh` 只會改寫 `juniperTable_`。
- [ ] 依客戶設計替換占位 UI 元件(`resources/ts/components/{home,menu,location}`)。
      連結一律走 `<LocaleLink>` + `usePagePaths()`(見 `gd-locale-links` skill)。
- [ ] 要加 API route 嗎(通常第一個是聯絡表單)?先裝 response 層再寫 controller。
      starter 沒有預裝,而且 Laravel 13 需要 VCS pin(上游只支援到 12):
      `composer config repositories.laravel-responder vcs https://github.com/laravel-shift/laravel-responder.git`
      再 `composer require "flugger/laravel-responder:dev-l13-compatibility"`。
      完整流程與兩個坑(發佈語系檔會改掉 `langPath()`;envelope 絕對不能吃掉
      validation 的 422)見 [`docs/api-responses.md`](api-responses.md)。

## 2. GorillaDash CMS

- [ ] Website 已建立;記下 **org id + website id** → overlay `config.env`
      (`GD_ORG_ID`、`GD_WEBSITE_ID`)。
- [ ] 該 website 的 OAuth client-credentials → `GD_WEBSITE_CLIENT_ID` /
      `GD_WEBSITE_CLIENT_SECRET`(secret 放 k8s Secret,不放 config.env)。
- [ ] 每個 website page 都填了 `vue_route_name`(`{page}` 路由和選單的
      「Internal Url」項目都依賴它)。
- [ ] Cache-clear webhook 指向這個站;`GD_WEBSITE_PUBLIC_KEY` 已設定。

## 3. Tolgee(i18n)

這幾項有三項會**安靜地**壞掉——不管有沒有做,網站都照樣 render 每個 key 內建的英文
default,所以在翻譯者問「字串在哪」之前,看起來完全正常。

- [ ] 幫「這個客戶」建立 Tolgee 專案;翻譯已 publish → CDN URL 填入各國
      `config.env` 的 `TOLGEE_CDN_URL`。content delivery 的設定照抄現有客戶:
      JSON + ICU、auto-publish、狀態 TRANSLATED/REVIEWED。
- [ ] **`.tolgeerc` 的 `projectId` 改成這個客戶的專案。** 它出廠時帶著別的客戶的
      id,所以在你改掉之前跑任何 `tolgee` 指令,都會把這個站的 key 建進「那個」
      專案——指令會成功、不會有任何異狀,災情只在另一個客戶的 Tolgee 看得到。專案
      還沒建好之前就把那一行刪掉:沒有 id 時 CLI 會直接拒跑並說明原因,那才是安全
      狀態。
- [ ] 專案的語言 **tag** 跟 `APP_LOCALES` 完全一致——是 `en-US`,不是新專案預設的
      `en`。Tolgee 的 `BackendFetch` 會去 CDN 抓 `<tag>.json`,對不上就是每個 key
      都 404。要用「改 tag」而不是「新增第二個語言再刪掉」:改 tag 保留翻譯,新增
      後刪除會整批不見。
- [ ] 每個國家設定 `APP_LOCALES`(第一個是預設語系)。之後加語言是純資料操作——
      照 `add-locale` skill 走。
- [ ] 原文字串已推上去:`tolgee sync --yes`。(乾跑是 `tolgee compare`,但專案一個
      key 都沒有時它會 crash,所以第一次只能直接 `sync`。)
- [ ] `tolgee sync` 結束時是 **0 warning**。warning 不是美觀問題:每一個
      ``Expected source of `t` function`` warning 都代表一個被 extractor 跳過、翻譯者永遠
      看不到的字串。純模組如果把 translate function 當參數收,參數必須叫 `$t`
      ——見 CLAUDE.md 的 i18n 段落。

## 4. 靜態資產

- [ ] 品牌字型取得授權;master 檔 subset 成 woff2/woff(master 留在
      `fonts-src/`),在 `vite.config.ts` 的 `fonts:` 加 `local(...)` 項目,並在
      `resources/css/app.css` 擴充 `--font-*` token + fallback metrics。
- [ ] 圖片放入 `public/static/images/{icon,logo,bg,menu}/`,然後
      `pnpm run static:upload`(需要 gcloud auth)。開發環境也是打 CDN——
      沒上傳前什麼都不會顯示。

  圖片放在哪裡——每個客戶都一樣,以下都不是 per-site 設定:
  - **Bucket:**`gs://gorilladash-static-files`,所有客戶共用(沒有 per-client
    bucket)。GCP 專案 `gorilla-dash-178800`(「Gorilla Dash」,編號 646282229388),
    區域 `US-WEST1`,物件為 public-read。
  - **CDN:**`https://cdn.gorilladash.com/`——Fastly 擋在該 bucket 前面,路徑相同;
    回應帶 `cache-control: max-age=31536000`。
  - **客戶資料夾:**`static/clients/<camelCaseSlug>_/`——camelCase 的 slug 加結尾底線
    (`great-burger` → `greatBurger_`、`the-great-greek` → `theGreatGreek_`)。
    `bin/new-client.sh` 寫進 `VITE_GCS_STATIC_URL` 和 `static:upload` 的就是這個值。
  - **資料夾內結構:**`images/{icon,logo,bg,menu}/` 與 `fonts/`——就是 `public/static/`
    原樣鏡像。
  - 既有客戶重做新站時,要在舊站資料夾旁邊**另開**一個底線資料夾(`theGreatGreek/`
    → `theGreatGreek_/`、`GrazeCraze/` → `grazeCraze_/`)。絕不要上傳到舊站資料夾:
    結構不同,而且舊站還在從那裡出圖。先看一下現況:
    `gcloud storage ls gs://gorilladash-static-files/static/clients/`。
  - 認證:`gcloud auth login`(token 會過期——過期時會出現「Reauthentication
    failed」),再 `gcloud config set project gorilla-dash-178800`。
  - 上傳只增不刪(`rsync --recursive`,不會刪除),而且 CDN 會快取一年,所以要換圖
    就給新檔名,不要覆蓋舊檔。
  - 驗證:`curl -sI https://cdn.gorilladash.com/static/clients/<prefix>/images/logo/<file>`
    → `HTTP/2 200` 且 `content-type` 正確。

- [ ] Favicon 上到 CDN;把 `resources/views/app.blade.php` 裡註解掉的
      `<link rel=icon>` 區塊還原。

## 5. GCP(每個客戶一次)

完整的順序版照 `deploy/README.md` 的「First-time go-live checklist」走。摘要:

- [ ] Artifact Registry repo(`deploy/build-and-push.sh` 會自動建立)。
- [ ] 靜態資產不用另外建任何東西——所有客戶共用 `gorilladash-static-files` bucket
      (見 [§4 · 靜態資產](#4-靜態資產))。
- [ ] Cloud SQL 資料庫 + 使用者;instance 名稱填入 overlay `config.env`
      (`CLOUD_SQL_INSTANCE`、`DB_DATABASE`)。
- [ ] Workload Identity:`make wi-gsa`(每個 GCP 專案一次)+ `make wi-bind`
      (每國家/namespace 一次)。
- [ ] 每個國家一個 global static IP(`gcloud compute addresses create <slug>-usa-ip --global`)。
- [ ] Cloud Armor origin 鎖定:`deploy/setup-cloud-armor.sh`
      (`refresh-edge-ips` workflow 會持續同步;檢查它的 env 區塊)。
- [ ] GitHub 部署憑證(WIF,無金鑰):repo secrets `GCP_WIF_PROVIDER` +
      `GCP_SA_EMAIL` — 一次性設定見 `deploy/README.md`(CI 章節)。

## 6. Cloudflare(每個國家一次)

- [ ] DNS 記錄指向該國的 static IP,並且要**經過 proxy**(橘色雲),對 origin 走
      HTTP。SSL 模式用 Flexible;若要 Full (strict),用 `make origin-tls` 裝
      Origin CA 憑證並在 overlay 的 ingress 加上 `spec.tls`。
- [ ] `CLOUDFLARE_ZONE_ID` + `CLOUDFLARE_HOSTS` 填入 overlay `config.env`
      (`cloudflare-rules` workflow 和 `deploy.sh` 都從 overlays 自動發現 host)。
- [ ] API token(scope 限縮在此客戶 zone 的 **Cache Settings Write + Zone Read**)
      → Secret Manager(`<slug>-cloudflare-api-token`)、GitHub repo secret
      `CLOUDFLARE_API_TOKEN`、以及 k8s Secret。
- [ ] Cache rules 套用:`CLOUDFLARE_API_TOKEN=... deploy/cloudflare/apply-rules.sh <host>`
      (或 push main 讓 workflow 收斂)。它會對線上 host 實測,bypass 規則沒命中就
      自動 rollback。
- [ ] GD 內容發佈時的 purge webhook(見 `deploy/cloudflare/README.md`)。

## 7. k8s overlay(每個國家一次)

- [ ] `deploy/k8s/overlays/<country>/config.env` — 填滿所有空值。
- [ ] `secret.example.yaml` → `secret.yaml`(gitignored),填值、`kubectl apply`,
      並備份到 Secret Manager。
- [ ] 站上有公開表單的話:該國家網域的 reCAPTCHA v3 金鑰對(金鑰綁網域,每個國家
      要自己申請一組)。公開的 `RECAPTCHA_SITE_KEY` 放 `config.env`;
      `RECAPTCHA_SECRET_KEY` 放 k8s Secret,不要放 ConfigMap。兩個都留空 = 不啟用。
- [ ] `ingress.yaml` 的 host + static-ip annotation 對應該國家。
- [ ] 第二個國家?複製 `overlays/usa`,換名稱/網域/DB,並把它加進
      `deploy` workflow 的 `country` 選項。

## 8. 驗證

- [ ] `make ship COUNTRY=<country>`(或 `deploy` workflow),然後照
      `deploy/CHECKLIST.md` 走完。
- [ ] `deploy/smoke-origin-lockdown.sh` — origin 只回應 edge。
- [ ] 匿名頁面回 `cf-cache-status: HIT`(`deploy/cloudflare/verify-rules.sh <host>`)。
- [ ] 上線前跑一次 Lighthouse(`lighthouse-pagespeed` skill)。
