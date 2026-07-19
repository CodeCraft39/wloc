# Changed files

## Functional changes

1. `dist/wloc.js`
   - Replaced the previous response-only runtime with a universal request/response runtime.
   - Preserves the existing `wloc_settings` JSON storage used by the Shortcut.
   - Adds request-time synthetic WLOC response generation.
   - Keeps response-time ARPC/protobuf coordinate rewriting as fallback.
   - Uses fail-open behavior so an unsupported response is returned unchanged rather than breaking location traffic.
   - File name remains `wloc.js`; there is no iOS-version-specific name.

2. `modules/wloc.module`
   - Keeps the original module filename and display name.
   - Adds both request and response interception for `/clls/wloc`.
   - Both entries load `dist/wloc.js`.
   - Keeps the existing settings endpoint and MITM hostnames.
   - Debug logging is enabled for device testing.

## Documentation added

3. `CHANGED_FILES.md`
   - This file. It records the exact changed-file list and the purpose of each change.

4. `DEBUG_GUIDE.md`
   - Documents the WLOC diagnostic endpoint, execution stages, and payload-comparison fields.

## Unchanged

- `dist/wloc-settings.js`
- Shortcut and Worker API flow
- Worker source files
- Other client module formats (`wloc.conf`, `wloc.lpx`, `wloc.sgmodule`, `wloc.stoverride`)

## Test status

The JavaScript passes syntax validation.

The implementation has been verified on physical devices running:

- iOS 16
- iOS 18

Verified behaviour:

- Request interception works.
- Response interception works.
- Coordinate replacement works.
- Wi-Fi location spoofing works.
- The original protobuf structure and record count are preserved.
- Payload length may differ slightly because protobuf signed-varint length depends on the replacement coordinates.
- Exact payload-length equality is not required for compatibility.
