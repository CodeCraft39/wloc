# WLOC diagnostic endpoint

Open this URL in Safari after triggering current location in Apple Maps:

```text
https://gs-loc.apple.com/wloc-settings/save?action=debug
```

The JSON result reports the latest execution stage from `dist/wloc.js`.

## Stage meanings

- `script-started`: the WLOC rule executed.
- `settings-loaded`: saved coordinates were read and normalized.
- `request-body-received`: the request-mode rule received a binary request body.
- `request-synthetic-response`: request-mode generated a spoofed response.
- `response-body-received`: response-mode received Apple's binary response.
- `response-patched`: the response parser found and changed location records.
- `response-body-missing`: the response rule ran but Shadowrocket exposed no usable body.
- `failed`: the script threw an error; inspect the `error` field.

`completed: true` means the worker reached a terminal stage successfully.

Successful spoofing should also be confirmed by checking:

- `wifiPatched` or `cellPatched`
- the patched coordinates in `patchedPayloadSummary`
- the location reported by the device

## Payload diagnostics

The debug endpoint reports payload-comparison fields including:

- `originalPayloadLength`
- `patchedPayloadLength`
- `originalPayloadFields`
- `patchedPayloadFields`
- `originalPayloadSummary`
- `patchedPayloadSummary`
- `comparisonError`

These fields help verify that the protobuf structure was preserved after coordinate replacement.

### Payload length

The patched payload is **not required** to have the same byte length as the original payload.

Latitude and longitude use protobuf signed-varint encoding. Different coordinate values can therefore require different numbers of bytes.

Example:

```text
Original payload : 6366 bytes
Patched payload  : 6356 bytes
```

This is expected and has been verified to work on both iOS 16 and iOS 18.

The important checks are:

- the protobuf field structure still matches
- the record count still matches
- the coordinates were replaced successfully
- `comparisonError` is `null`
- no unrelated fields were removed or rebuilt

### Coordinate replacement strategy

The stable implementation preserves each original location message and replaces only:

- field 1: latitude
- field 2: longitude

Other fields remain unchanged, including accuracy, altitude, motion data, unknown fields, and field ordering wherever possible.

Rebuilding the complete location message is less reliable than preserving the original message and replacing only its coordinate fields.

## Wi-Fi and cellular records

Typical successful output may show:

```text
wifiPatched = 106
cellPatched = 0
```

This can still occur when Wi-Fi is turned off and the device uses mobile data.

The network carrying the HTTPS request and the positioning records contained in the WLOC response are separate. iOS may still use or retain nearby Wi-Fi observations for location positioning even while the request itself travels over the cellular network.

## Files changed

- `dist/wloc.js`
- `dist/wloc-settings.js`
- `DEBUG_GUIDE.md`
