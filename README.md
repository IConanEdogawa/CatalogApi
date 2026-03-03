# CatalogApi

This project hosts three public catalog viewer pages and one administration page. To avoid easy discovery, the HTML files for the catalogs and the admin interface are intentionally given unguessable names. The application routes `/a`, `/b`, and `/c` to the obfuscated filenames and the root (`/`) redirects to the first catalog. The current filenames are:

* `/f9b3c1a2.html` – site A
* `/q7r8s2t4.html` – site B
* `/k1m4n6p8.html` – site C
* `/z3x9v7w1.html` – admin (was previously `5755nimda.html`)

Developers can change these values by modifying the constants near the top of `Program.cs` and renaming the corresponding files.