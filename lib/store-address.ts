/* eslint-disable @typescript-eslint/no-explicit-any */

/** Shape a CustomerAddress row for the storefront (structured + a display line). */
export function shapeAddress(a: any) {
  const line = [a.streetAddress, a.landmarks, `${a.city} - ${a.pincode}`]
    .filter(Boolean)
    .join(", ");
  return {
    id: a.id,
    name: a.name,
    mobile: a.phoneNumber,
    line,
    streetAddress: a.streetAddress,
    landmarks: a.landmarks ?? "",
    city: a.city,
    state: a.state,
    country: a.country,
    pincode: a.pincode,
    addressType: a.addressType ?? "",
    isDefault: a.isDefault,
  };
}
