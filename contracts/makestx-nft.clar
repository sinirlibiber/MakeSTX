;; MakeSTX NFT Contract
;; SIP-009 compliant NFT - Cyberpunk Collection
;; 10,000 Supply - Free Mint - Bitcoin-Secured via Stacks

;; NFT Definition
(define-non-fungible-token makestx-nft uint)

;; Constants
(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u100))
(define-constant ERR-NOT-FOUND (err u101))
(define-constant ERR-ALREADY-LISTED (err u102))
(define-constant ERR-NOT-LISTED (err u103))
(define-constant ERR-WRONG-PRICE (err u104))
(define-constant ERR-MINT-LIMIT (err u105))
(define-constant ERR-PAUSED (err u106))

;; Data Vars
(define-data-var last-token-id uint u0)
(define-data-var max-supply uint u10000)
(define-data-var royalty-percent uint u5)
(define-data-var mint-paused bool false)
(define-data-var base-uri (string-utf8 256) u"https://makestx.io/metadata/")
(define-data-var collection-name (string-ascii 64) "MakeSTX Cyberpunk")

;; Data Maps
(define-map token-owner uint principal)
(define-map marketplace-listings uint { price: uint, seller: principal })
(define-map creator-royalties uint principal)
(define-map minted-per-wallet principal uint)

;; SIP-009: get-last-token-id
(define-read-only (get-last-token-id)
  (ok (var-get last-token-id)))

;; SIP-009: get-token-uri
(define-read-only (get-token-uri (token-id uint))
  (ok (some (var-get base-uri))))

;; SIP-009: get-owner
(define-read-only (get-owner (token-id uint))
  (ok (nft-get-owner? makestx-nft token-id)))

;; SIP-009: transfer
(define-public (transfer (token-id uint) (sender principal) (recipient principal))
  (begin
    (asserts! (is-eq tx-sender sender) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? marketplace-listings token-id)) ERR-ALREADY-LISTED)
    (try! (nft-transfer? makestx-nft token-id sender recipient))
    (map-set token-owner token-id recipient)
    (ok true)))

;; Mint - FREE, gas only
(define-public (mint (recipient principal))
  (let (
    (token-id (+ (var-get last-token-id) u1))
    (minted-so-far (default-to u0 (map-get? minted-per-wallet recipient)))
  )
    (asserts! (not (var-get mint-paused)) ERR-PAUSED)
    (asserts! (<= token-id (var-get max-supply)) ERR-MINT-LIMIT)
    (try! (nft-mint? makestx-nft token-id recipient))
    (map-set token-owner token-id recipient)
    (map-set creator-royalties token-id recipient)
    (map-set minted-per-wallet recipient (+ minted-so-far u1))
    (var-set last-token-id token-id)
    (ok token-id)))

;; Admin mint
(define-public (admin-mint (recipient principal))
  (let ((token-id (+ (var-get last-token-id) u1)))
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= token-id (var-get max-supply)) ERR-MINT-LIMIT)
    (try! (nft-mint? makestx-nft token-id recipient))
    (map-set token-owner token-id recipient)
    (map-set creator-royalties token-id recipient)
    (var-set last-token-id token-id)
    (ok token-id)))

;; List NFT on marketplace
(define-public (list-nft (token-id uint) (price uint))
  (let ((owner (unwrap! (nft-get-owner? makestx-nft token-id) ERR-NOT-FOUND)))
    (asserts! (is-eq tx-sender owner) ERR-NOT-AUTHORIZED)
    (asserts! (is-none (map-get? marketplace-listings token-id)) ERR-ALREADY-LISTED)
    (asserts! (> price u0) ERR-WRONG-PRICE)
    (map-set marketplace-listings token-id { price: price, seller: tx-sender })
    (ok true)))

;; Unlist NFT
(define-public (unlist-nft (token-id uint))
  (let ((listing (unwrap! (map-get? marketplace-listings token-id) ERR-NOT-LISTED)))
    (asserts! (is-eq tx-sender (get seller listing)) ERR-NOT-AUTHORIZED)
    (map-delete marketplace-listings token-id)
    (ok true)))

;; Buy NFT
(define-public (buy-nft (token-id uint))
  (let (
    (listing (unwrap! (map-get? marketplace-listings token-id) ERR-NOT-LISTED))
    (price (get price listing))
    (seller (get seller listing))
    (creator (unwrap! (map-get? creator-royalties token-id) ERR-NOT-FOUND))
    (royalty-amount (/ (* price (var-get royalty-percent)) u100))
    (seller-amount (- price royalty-amount))
  )
    (asserts! (not (is-eq tx-sender seller)) ERR-NOT-AUTHORIZED)
    (try! (stx-transfer? royalty-amount tx-sender creator))
    (try! (stx-transfer? seller-amount tx-sender seller))
    (try! (nft-transfer? makestx-nft token-id seller tx-sender))
    (map-delete marketplace-listings token-id)
    (map-set token-owner token-id tx-sender)
    (ok true)))

;; Read helpers
(define-read-only (get-listing (token-id uint))
  (map-get? marketplace-listings token-id))

(define-read-only (get-total-supply)
  (var-get last-token-id))

(define-read-only (get-max-supply)
  (var-get max-supply))

(define-read-only (get-collection-name)
  (var-get collection-name))

(define-read-only (get-minted-by-wallet (wallet principal))
  (default-to u0 (map-get? minted-per-wallet wallet)))

(define-read-only (is-mint-paused)
  (var-get mint-paused))

;; Admin: set base URI
(define-public (set-base-uri (new-uri (string-utf8 256)))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set base-uri new-uri)
    (ok true)))

;; Admin: pause/unpause mint
(define-public (set-mint-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (var-set mint-paused paused)
    (ok true)))

;; Admin: set royalty percent (max 20%)
(define-public (set-royalty-percent (pct uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (<= pct u20) ERR-NOT-AUTHORIZED)
    (var-set royalty-percent pct)
    (ok true)))
