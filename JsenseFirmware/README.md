Public firmware bundles for JSense device.

Structure:
- JsenseFirmware/
  - vX.Y.Z/
    - jsense-vX.Y.Z.jsb   (bundle: firmware + LittleFS)

Add a new version by creating a folder with the semver version and placing a single .jsb file inside.
The device lists this folder and picks the highest version.
