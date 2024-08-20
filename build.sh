#cd ai-journal-app
#npm run build
#cd ..
mkdir -p temp
cp -rf ai-journal temp/
cd temp/ai-journal
mkdir -p src/main/resources/static
cp -rf ../../ai-journal-app/build src/main/resources/static
gradle bootjar
