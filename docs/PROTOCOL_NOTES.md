# Apple WLOC Protocol Notes

This document records implementation observations and protocol behaviour discovered
while reverse engineering and testing Apple's `/clls/wloc` endpoint.

These notes are based on verified testing across **iOS 16** and **iOS 18**.

---

# Verified Behaviour

The current implementation has been verified to:

- Work on iOS 16.
- Work on iOS 18.
- Successfully spoof Wi-Fi based positioning.
- Preserve Apple's protobuf structure.
- Preserve all original records.
- Successfully update location using only coordinate replacement.

---

# Payload Length

A patched Apple WLOC protobuf **does not need to preserve the exact byte length**
of the original payload.

The important requirement is preserving the original protobuf structure. Exact
payload-length equality is **not** a protocol requirement.

## Required

- Preserve every original protobuf record.
- Preserve every existing protobuf field.
- Preserve field ordering whenever possible.
- Replace only the coordinate values.
- Leave unrelated metadata untouched.

## Not Required

The following is **not** a protocol requirement:

- Identical payload length.

Changing latitude and longitude may legitimately change the encoded payload size
because protobuf signed-varint encoding uses a variable number of bytes
depending on the coordinate values.

Example:

```text
Original payload : 6366 bytes
Patched payload  : 6356 bytes
```

The above payload has been verified to work correctly on both iOS 16 and iOS 18.

---

# Location Replacement Strategy

The most reliable implementation is to preserve the original `Location` protobuf
message and replace **only** the coordinate fields.

Replace only:

| Field | Meaning |
|------:|---------|
| 1 | Latitude |
| 2 | Longitude |

Leave everything else untouched, including:

- horizontal accuracy
- vertical accuracy
- altitude
- motion information
- unknown Apple fields
- future protocol fields

This minimizes protocol differences and maximizes compatibility.

---

# Payload Preservation

Avoid rebuilding the entire `Location` message.

Instead:

1. Parse the original message.
2. Preserve every existing field.
3. Replace only latitude and longitude.
4. Re-encode the original message.

This approach has proven significantly more reliable than reconstructing a new
`Location` message.

---

# Wi-Fi vs Cellular

Apple's WLOC responses observed during testing contained only Wi-Fi positioning
records.

Typical debug output:

```text
wifiPatched = 106
cellPatched = 0
```

This remained true even when the device was connected using mobile data with
Wi-Fi disabled.

This indicates:

- the HTTPS request may travel over the cellular network,
- while Apple's positioning solution still uses nearby Wi-Fi observations.

Cell tower positioning was not observed during testing.

---

# Location Update Delay

After restoring the real location and enabling spoofing again, the first spoofed
location update may take noticeably longer.

Observed behaviour:

1. Restore real location.
2. Enable spoofing.
3. First spoof takes several seconds.
4. All subsequent spoofed locations update almost immediately.

The worker updates the protobuf immediately.

This behaviour appears to be caused by Apple's internal location caching or
location-fusion logic rather than the protocol implementation.

No additional code changes were required.

---

# Debug Diagnostics

The following debug values are useful and should be retained:

- originalPayloadLength
- patchedPayloadLength
- originalPayloadFields
- patchedPayloadFields
- originalPayloadSummary
- patchedPayloadSummary
- comparisonError

These diagnostics quickly detect:

- lost protobuf fields
- payload corruption
- coordinate replacement failures
- unexpected structural changes

They are exposed only through the debug endpoint and have proven valuable during
development.

---

# Stable Baseline

The current coordinate-preserving implementation should be considered the
reference implementation.

Verified characteristics:

- Works on iOS 16.
- Works on iOS 18.
- Preserves the original protobuf structure.
- Preserves all original records.
- Replaces only latitude and longitude.
- Allows payload size changes caused by protobuf signed-varint encoding.
- Produces valid Apple WLOC responses.