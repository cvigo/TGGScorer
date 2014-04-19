project_path="phonegap"
keystore_path="/Users/carlosvigo/Google Drive/developer/cvv-keys.keystore"
release_apk="$project_path/platforms/android/ant-build/MatchPlayScorer-release-unsigned.apk"

cp -R web/ "$project_path/www"

cd "$project_path"
phonegap build android

cd platforms/android/cordova

./build --release

cd ../../../..
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore "$keystore_path" "$release_apk" cvvselfkey