project_path="/Users/carlosvigo/Google Drive/developer/IdeaProjects/TGGScorer/phonegap"
keystore_path="/Users/carlosvigo/Google Drive/developer/cvv-keys.keystore"
release_apk="$project_path/platforms/android/ant-build/MatchPlayScorer-release-unsigned.apk"

cd "$project_path"
phonegap build android

cd platforms/android/cordova

./build --release
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 -keystore "$keystore_path" "$release_apk" cvvselfkey