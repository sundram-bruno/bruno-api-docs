---
"@usebruno/api-docs": patch
---

What changed
18. Environment value fields. Multiline value fields grow to fit their content instead of scrolling inside a fixed box, and they re-fit when a column is dragged narrower. Table, card and secret variants now behave the same.

21. Header name suggestions. The suggestions list renders in a portal, so the playground's scrollbar styling never reached it. It now uses the same thin themed scrollbar as the rest of the app.

24. Request tabs across a dock change. Changing the dock placement swaps the dock component and remounts the request and response panes, which reset their tab to the default. Both panes now keep the selected tab in session storage, the lane the collapsible sections and dock sizes already use.

26. Assertion descriptions. The Assertions tab was the only tab without a Description column, although the format and the desktop app both carry the field. It now shows and persists the description, and its column labels match the app (Expr, Value).

29. First column alignment. The first column header now starts exactly where the cell text below it starts, with and without the enable checkbox. The query params table labels that column Name instead of Key, as the app does.

31. Script error cards. When both the post-response and tests scripts failed, closing one error card closed both, and the cards took the panel's height from the content below them. Each card now closes on its own and the response body and test results keep their full height.

Also in this PR
KeyValueTable.css becomes an Emotion StyledWrapper, matching every other component in the package. The legacy .text-input rules are dropped because HighlightedInput already owns those fields.
