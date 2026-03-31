source .env
if [ -z "$1" ]
  then
    echo "Error: No file supplied"
    exit 1
fi
inputfile=$1
productsign --sign $DEV_ID_INSTALLER ${inputfile} dist/signed.pkg
wait
xcrun notarytool submit dist/signed.pkg --apple-id=$APPLE_ID --password=$APPLE_ID_PASS --team-id=$APPLE_ID_TEAM
wait
echo "Waiting..."
sleep 5m

xcrun stapler staple dist/signed.pkg
wait
mv dist/signed.pkg ${inputfile}
spctl --assess --verbose --type install ${inputfile}
wait

echo "Done"