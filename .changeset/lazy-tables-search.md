---
"@usebruno/api-docs": patch
---

Bugfixes:
19. The folder and collection pages now have an Execution Context section, separate from the configuration section. Headers and auth stay under Folder Configuration and Collection Configuration; vars, script and tests move into Execution Context, which collapses and expands like the one on request pages. The environment switcher is hidden from the docs header when the collection has no environments.

25. A long environment name is cut short with an ellipsis in the switcher and in its dropdown, and the full name shows in a tooltip when it is cut.

32. Empty Post-Response variables now read "None." on the folder and collection pages, the same as on request pages, instead of the section disappearing.

33. The playground folder settings Vars tab now has a Post Response table, like the Bruno app. Edits are saved with the folder.

Also, when a collection has no environments, the playground switcher no longer opens a dropdown whose only entry repeats "No environments". It shows the text with no arrow.
