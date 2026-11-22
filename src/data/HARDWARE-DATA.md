# Hardware catalog attribution

The CPU and GPU name catalog in `hardware-catalog.json` is sourced from
[TechAPI](https://gettechapi.github.io/TechAPI/) and is licensed under the
[Creative Commons Attribution-ShareAlike 4.0 International license](https://creativecommons.org/licenses/by-sa/4.0/).

This project includes a modified, locally searchable snapshot of that catalog.
The catalog is provided for hardware name lookup only; it does not provide
performance benchmarks or imply that a listed component has been tested with
GTA 6. See `retrievedAt` in the JSON file for when the snapshot was downloaded.

To refresh the snapshot, run `npm run catalog:sync`. The sync script downloads
the latest CPU and GPU indexes from TechAPI and replaces the local JSON file.
Redistributions of the catalog or adaptations must retain attribution and use
the same or a compatible share-alike license, as required by CC BY-SA 4.0.
