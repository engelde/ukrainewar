# Changelog

## [1.1.0](https://github.com/engelde/ukrainewar/compare/ukrainewar-v1.0.0...ukrainewar-v1.1.0) (2026-03-25)


### Features

* accumulated key event markers, sidebar/timeline scroll fixes ([94bba7f](https://github.com/engelde/ukrainewar/commit/94bba7f487b3b916f0bb179c18f439d300615ffa))
* add cdn cache purge after data warming ([8208ca1](https://github.com/engelde/ukrainewar/commit/8208ca16e7d51c94570ea2f1a011409f91459eb6))
* mobile responsive layout fixes ([8005b7b](https://github.com/engelde/ukrainewar/commit/8005b7ba8df47a3d3deba5ad3333ea33d35d6171))
* responsive mobile layout for panels, sidebar, timeline, and nav ([63f34d4](https://github.com/engelde/ukrainewar/commit/63f34d4588fc145a6e1b2aa1875c050c2e70a078))
* russo-ukrainian war tracker ([a9942ee](https://github.com/engelde/ukrainewar/commit/a9942ee127725ad4bb3863e6d4fc802a5a57e447))
* timeline 2021 events, event click fix, sources/options UI fixes ([e362616](https://github.com/engelde/ukrainewar/commit/e362616a986b69f711f94f4cb4b27c8088e80f94))
* wire custom domain ukrainewar.app to worker ([9a9c739](https://github.com/engelde/ukrainewar/commit/9a9c739ba5ea2219a57bf22584095d4d08059d72))


### Bug Fixes

* default panels to bilateral aid, trim timeline to Mar 2021 ([7307756](https://github.com/engelde/ukrainewar/commit/73077562246485d6657401ab68a4faadf6d66faa))
* event popup shows closest matching event, not first in array ([35744fe](https://github.com/engelde/ukrainewar/commit/35744fea211cafbd28dce2433d1efba88bdc436e))
* generate prebuild data before typecheck in CI ([09fe223](https://github.com/engelde/ukrainewar/commit/09fe223e3536c23b444f8fa2e6e8e8ee19f3b763))
* prevent panels from showing data before the war starts ([8101fbd](https://github.com/engelde/ukrainewar/commit/8101fbd001498b264f221bd7f21e251f95c4b8e0))
* remove non-existent civilian-casualties endpoint from warming ([3de981d](https://github.com/engelde/ukrainewar/commit/3de981da01739239d7389d9a43104c57464d2565))
* replace vulnerable xlsx with exceljs ([6896a6d](https://github.com/engelde/ukrainewar/commit/6896a6d39bc762eb8dbebdd220c2a796396ba96a))
* resolve self-fetch 522 in FIRMS pre-warming endpoint ([2e11776](https://github.com/engelde/ukrainewar/commit/2e1177641ec57132174eedfd9256c2346c9c0b77))
* resolve self-fetch failures in cloudflare workers ([67cffe3](https://github.com/engelde/ukrainewar/commit/67cffe3f7d44174997b91bb1aaa5e0f508201faa))
* resolve worker resource limits (error 1102) ([fd9ef7d](https://github.com/engelde/ukrainewar/commit/fd9ef7dfaabd72bbe287c4da9e4a56ae900b7403))
* skip casualty requests for pre-war timeline dates ([fd58d6e](https://github.com/engelde/ukrainewar/commit/fd58d6e16be35d2c52bc22b7e531e8b237893f6f))
* timeline playback loops to war start instead of beginning ([6838de3](https://github.com/engelde/ukrainewar/commit/6838de33adbfb3d3fe271e8853f6c9867d7d6a37))


### Performance Improvements

* add missing endpoints to cache warming ([#14](https://github.com/engelde/ukrainewar/issues/14)) ([498aeca](https://github.com/engelde/ukrainewar/commit/498aeca86b412450db912028dfdb34b0017a7b14))
* prebuild alliance, acled-regional, and territory-dates ([dc4092d](https://github.com/engelde/ukrainewar/commit/dc4092d0cc4da058e2e83fb4ab66a2ce9f4ef8a1))
* prebuild events and ACLED map data for instant loading ([d19e45d](https://github.com/engelde/ukrainewar/commit/d19e45da9c8fca883a5bed5eb786a10391603ef8))
