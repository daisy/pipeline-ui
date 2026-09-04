#!/usr/bin/env bash
set -eo pipefail

# shellcheck source=/dev/null
[ -f .env ] && source .env
if [ "$#" -eq 0 ]
  then
    echo "Error: No file supplied"
    exit 1
fi

SIGNED_PKG="dist/signed.pkg"

for inputfile in "$@"; do
  rm -f "$SIGNED_PKG"
  productsign --sign "$DEV_ID_INSTALLER" "$inputfile" "$SIGNED_PKG"
  xcrun notarytool submit "$SIGNED_PKG" --apple-id="$APPLE_ID" --password="$APPLE_ID_PASS" --team-id="$APPLE_ID_TEAM" --wait

  xcrun stapler staple "$SIGNED_PKG"
  mv "$SIGNED_PKG" "$inputfile"
  spctl --assess --verbose --type install "$inputfile"
done

echo "Done"
