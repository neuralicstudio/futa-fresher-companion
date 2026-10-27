# Sabi copy (Pidgin)

One file, every string, by screen and key. **This document is generated** from [prototype/assets/copy.js](prototype/assets/copy.js): edit that file, then run `node docs/design/tools/build-copy-doc.mjs`. In the real app the same keys become `web/src/copy/pidgin.ts`.

## The voice

- **Friendly and funny, facts exact.** The joke lives in the wrapper ("No class today. Rest small, king."), never in the fact. Dates, times, places, counts and statuses are never joked with.
- **A senior student who knows every shortcut.** Light Pidgin ("Oya", "no wahala", "abeg", "make we", "dey", "don", "go") that a fresher from any state can read. Where Pidgin could confuse, the plain English word is kept (Verified, Level, Semester, Department).
- **Notices are the admin's words.** A notice's title and body are exactly what an admin wrote; Sabi never rewrites them. Only the frame around a notice is Sabi's voice.
- **Honest labels.** "Verified" appears only on a record that an admin verified. Notices show their source ("From SUG"), never "Verified". Anything not checked says so ("Not verified yet", "Source: OpenStreetMap, not yet checked by FUTA").
- **One handwritten line per screen** (the hero's `kicker`, set in Yellowtail). Nowhere else.
- **It's Sabi's, not FUTA's.** The privacy policy is "Sabi's privacy policy". The footer says "Unofficial app, not affiliated with FUTA." It is "FUTA no go hard for you. We dey with you." as a friendly sign-off, not a claim of affiliation.
- **Mechanics.** Sentence case. No em or en dashes. No emoji. Placeholders are {braces}. Plurals are separate keys (`department1`, `departments`).

## Strings (593)

### App (shared)

| Key | String |
|---|---|
| `app.name` | Sabi |
| `app.tagline` | FUTA Fresher Companion |
| `app.footer` | FUTA no go hard for you. We dey with you. |
| `app.unofficial` | Unofficial app, not affiliated with FUTA. |
| `app.sampleBar` | Sample data on this screen. Names, times and counts are made up. |

### Shell: tabs, navigation, common words

| Key | String |
|---|---|
| `shell.skip` | Skip to content |
| `shell.nav` | Main |
| `shell.tabs.home` | Home |
| `shell.tabs.map` | Map |
| `shell.tabs.academics` | Academics |
| `shell.tabs.timetable` | Timetable |
| `shell.tabs.notices` | Notices |
| `shell.profile` | Profile and settings |
| `shell.back` | Back |
| `shell.liteChip` | Lite |
| `shell.photoBy` | Photo: |
| `shell.close` | Close |
| `shell.seeAll` | See all |
| `shell.viewAll` | View all |
| `shell.sourceLabel` | Source |
| `shell.updated` | Updated {date} |
| `shell.updatedUnknown` | Update date no dey |
| `shell.noSource` | No source recorded |

### Profile sheet (top right icon)

| Key | String |
|---|---|
| `profile.title` | Your profile |
| `profile.guest` | You no sign in |
| `profile.guestHelp` | Sabi works without an account. Log in only if you be admin. |
| `profile.login` | Log in |
| `profile.register` | Create account |
| `profile.settings` | Settings |
| `profile.settingsSub` | Data, photos, theme, credits |
| `profile.admin` | Admin centre |
| `profile.adminSub` | Notices and data checks |
| `profile.logout` | Log out |
| `profile.logoutSub` | Safe exit, no drama. |
| `profile.levelLine` | {department}, {level} Level |

### Verification status

| Key | String |
|---|---|
| `status.verified` | Verified |
| `status.unverified` | Not verified yet |
| `status.outdated` | May be outdated |
| `status.unknown` | Status no dey |
| `status.verifiedBy` | Checked by {who} on {date} |
| `status.verifiedHelp` | Only an admin can verify. Sabi never marks a record verified by itself. |
| `status.sample` | Sample |

### Welcome

| Key | String |
|---|---|
| `welcome.kicker` | Oya, fresher! |
| `welcome.title` | Welcome to FUTA, |
| `welcome.titleGold` | Akure |
| `welcome.lead` | Make you no lost before your first lecture o. Sabi go show you road. |
| `welcome.start` | Oya, make we start! |
| `welcome.haveAccount` | I don get account. |
| `welcome.login` | Log in |

### Home

| Key | String |
|---|---|
| `home.kicker` | How far, fresher! |
| `home.title` | Welcome to FUTA, Akure. |
| `home.lead` | Your journey don start well. Sabi dey for you always. |
| `home.search` | Wetin you dey find? Place, course or lecturer |
| `home.searchFilters` | Filters |
| `home.badge.value` | {n} |
| `home.badge.unit` | mins |
| `home.badge.label` | to my next class |
| `home.badgeNone` | No class soon |
| `home.nextTitle` | Next lecture |
| `home.noticeTitle` | Latest notice |
| `home.popular` | Popular places |
| `home.popularHelp` | Names as written in OpenStreetMap or on the building signs. |
| `home.noTimetableTitle` | Next lecture |
| `home.noTimetableLine` | Add your department and level to see your next class here. |
| `home.noTimetableAction` | Add your timetable |
| `home.noNotice` | No notice yet. When one comes, e go show here. |
| `home.greeting.morning` | Good morning |
| `home.greeting.afternoon` | Good afternoon |
| `home.greeting.evening` | Good evening |
| `home.greeting.night` | Up late o |

### Campus Map

| Key | String |
|---|---|
| `map.kicker` | Find your way! |
| `map.title` | Campus |
| `map.titleGold` | Map |
| `map.blurbs.lecture` | Where lectures hold. Check your timetable for the venue. |
| `map.blurbs.building` | A building on campus. Offices, labs and classrooms dey inside. |
| `map.blurbs.library` | Books, e-resources and quiet place to study. |
| `map.blurbs.food` | Where you go chop. Prices and hours na for the owner to tell you. |
| `map.blurbs.sports` | Play, train, or just cheer. No wahala. |
| `map.blurbs.health` | For health matters. If na emergency, go straight there. |
| `map.blurbs.hostel` | A place to stay on campus. Rules and rooms na for the hostel office. |
| `map.blurbs.gate` | A way in or out of campus. |
| `map.lead` | From lecture theatres to food spots, find any place on FUTA campus fast. |
| `map.search` | Search for a building, lecture theatre or place |
| `map.categoriesTitle` | Quick categories |
| `map.categories.lecture` | Lecture theatres |
| `map.categories.building` | Buildings |
| `map.categories.food` | Food and drinks |
| `map.categories.library` | Libraries |
| `map.categories.sports` | Sports and recreation |
| `map.categories.health` | Health services |
| `map.categories.hostel` | Hostels |
| `map.categories.gate` | Gates |
| `map.myLocation` | My location |
| `map.locationOff` | Location is off. Turn it on in your phone settings if you want your dot on the map. |
| `map.zoomIn` | Zoom in |
| `map.zoomOut` | Zoom out |
| `map.compass` | North is up |
| `map.mapLabel` | Campus map. Use the list below if you prefer. |
| `map.resultsTitle` | Places |
| `map.resultsCount` | {n} places |
| `map.viewOnMap` | View on map |
| `map.openPlace` | See details |
| `map.noPhoto` | Photo dey come |
| `map.noMatchTitle` | No place match "{q}" |
| `map.noMatchBody` | Check the spelling, try a shorter word, or pick a category. |
| `map.offlineNote` | Map dey work offline. E no need data. |
| `map.attribution` | Map data © OpenStreetMap contributors |
| `map.attributionLink` | Licence: ODbL |
| `map.routingSoon` | Directions no dey yet. For now, use the map and the landmarks. |
| `map.sourceLine` | Source: OpenStreetMap, not yet checked by FUTA |

### Place detail

| Key | String |
|---|---|
| `place.kicker` | See this place |
| `place.about` | About this place |
| `place.category` | Type |
| `place.where` | Where |
| `place.hours` | Opening hours |
| `place.hoursUnknown` | Opening hours no dey |
| `place.hoursSample` | Hours are sample data until the admin adds them. |
| `place.photoTitle` | Photo |
| `place.photoCredit` | Photo: {author}, {licence} |
| `place.noPhotoTitle` | Photo dey come |
| `place.noPhotoBody` | Anybody get correct photo of this place? Send am to your department admin. |
| `place.viewOnMap` | View on map |
| `place.nearby` | Nearby |
| `place.back` | Back to map |
| `place.notFoundTitle` | This place no dey saved on this phone |
| `place.notFoundBody` | Connect to data once, and Sabi go save the list. |

### Academics

| Key | String |
|---|---|
| `academics.kicker` | Your academics, |
| `academics.title` | no |
| `academics.titleGold` | stress! |
| `academics.lead` | Browse FUTA's schools, departments, courses and lecturers. Find what you need, fast. No wahala. |
| `academics.search` | Search for a school, department, course or lecturer |
| `academics.schoolsTitle` | FUTA Schools |
| `academics.schoolsCount` | {n} Schools |
| `academics.departments` | {n} Departments |
| `academics.department1` | 1 Department |
| `academics.back` | Back to Schools |
| `academics.tabs.courses` | Courses |
| `academics.tabs.lecturers` | Lecturers |
| `academics.tabs.about` | About |
| `academics.popularCourses` | Popular courses |
| `academics.keyLecturers` | Key lecturers |
| `academics.allCourses` | All courses |
| `academics.hod` | Head of Department |
| `academics.lecturerRole` | Lecturer |
| `academics.aboutTitle` | About this department |
| `academics.office` | Office |
| `academics.email` | Email |
| `academics.loading` | Dey load schools |
| `academics.emptyTitle` | No school dey here yet |
| `academics.emptyBody` | Connect to data once, and Sabi go save the list for offline. |
| `academics.errorTitle` | We no fit read the schools for this phone |
| `academics.errorBody` | Try again. If e still no work, check your storage. |
| `academics.retry` | Try again |
| `academics.lecturersEmpty` | No lecturer don dey added for this department yet. |
| `academics.coursesEmpty` | No course don dey added for this department yet. |
| `academics.notFound` | This department no dey saved on this phone. |

### Timetable

| Key | String |
|---|---|
| `timetable.kicker` | Your timetable, |
| `timetable.title` | sorted! |
| `timetable.titleGold` |  |
| `timetable.lead` | See your classes for the week, know what's next and never miss a lecture. FUTA no dey play! |
| `timetable.level` | Level |
| `timetable.semester` | Semester |
| `timetable.levelValue` | {n} Level |
| `timetable.semesters.first` | First semester |
| `timetable.semesters.second` | Second semester |
| `timetable.today` | Today |
| `timetable.nextClass` | Next class |
| `timetable.nextUp` | Next up |
| `timetable.inMin` | in {n} min |
| `timetable.lecture` | Lecture |
| `timetable.practical` | Practical |
| `timetable.emptyDayTitle` | No class today |
| `timetable.emptyDayBody` | Rest small, king. You don earn am. |
| `timetable.notAddedTitle` | Timetable never dey yet? |
| `timetable.notAddedBody` | Your class schedule dey still upload. Check back later or ask your department. |
| `timetable.contactDept` | Contact dept. |
| `timetable.times` | Times na Nigerian time. |
| `timetable.venueMissing` | Venue never dey yet. |
| `timetable.courseMissing` | Course details no dey saved on this phone. |
| `timetable.loading` | Dey load timetable |
| `timetable.errorTitle` | We no fit read your timetable |
| `timetable.errorBody` | Try again. Your saved classes no go commot. |
| `timetable.retry` | Try again |
| `timetable.chooseDepartmentTitle` | Choose your department first |
| `timetable.chooseDepartmentBody` | Sabi need your department and level to show your classes. |
| `timetable.chooseDepartment` | Choose department |
| `timetable.weekNav` | Days this week |

### Notices

| Key | String |
|---|---|
| `notices.kicker` | Don't miss out! |
| `notices.title` | Latest |
| `notices.titleGold` | Notices |
| `notices.lead` | Stay updated on announcements from FUTA, SUG, your school and department. No wahala, we got you! |
| `notices.search` | Search notices, keywords or departments |
| `notices.filters.all` | All |
| `notices.filters.university` | University |
| `notices.filters.sug` | SUG |
| `notices.filters.school` | My school |
| `notices.filters.department` | My department |
| `notices.scope.university` | University |
| `notices.scope.sug` | SUG |
| `notices.scope.school` | School |
| `notices.scope.department` | Department |
| `notices.from` | From {source} |
| `notices.posted` | Posted {date} |
| `notices.unread` | Unread |
| `notices.newest` | New |
| `notices.viewDetails` | View full details |
| `notices.attachment` | Attachment |
| `notices.emptyTitle` | No new notices |
| `notices.emptyBody` | You don catch up, fresher. Check back later. |
| `notices.emptyFiltered` | No notice from {scope} yet. |
| `notices.loading` | Dey load notices |
| `notices.errorTitle` | We no fit read the notices |
| `notices.errorBody` | Try again. The ones wey you don save still dey. |
| `notices.retry` | Try again |
| `notices.offlineBody` | You dey offline. Sabi dey show the notices wey you don save. |
| `notices.unreadDot` | New notices |

### Notice detail

| Key | String |
|---|---|
| `notice.kicker` | See the full gist |
| `notice.title` | Notice |
| `notice.back` | Back to notices |
| `notice.postedBy` | Posted by {who} |
| `notice.audience` | For: {audience} |
| `notice.expires` | Expires {date} |
| `notice.noExpiry` | No expiry date |
| `notice.sourceTitle` | Where this come from |
| `notice.sourceHelp` | Sabi shows who posted a notice. The words are exactly what the admin wrote. |
| `notice.share` | Share |
| `notice.notFoundTitle` | This notice no dey saved on this phone |
| `notice.notFoundBody` | E fit don expire or the admin remove am. |

### Register

| Key | String |
|---|---|
| `register.kicker` | Small details, big dreams! |
| `register.title` | Create your |
| `register.titleGold` | account, fresher! |
| `register.lead` | Na small step, make e dey bring you closer to your goals. |
| `register.optional` | An account na only for admin features. Everything else dey work without am. |
| `register.fullName` | Full name |
| `register.fullNamePh` | Enter your full name |
| `register.email` | Email address |
| `register.emailPh` | e.g. yourname@gmail.com |
| `register.emailHint` | Any email dey work. E no need to be a FUTA email. |
| `register.password` | Password |
| `register.passwordPh` | Strong password |
| `register.passwordHint` | Use at least 8 characters, with a mix of letters, numbers and symbols. |
| `register.showPassword` | Show password |
| `register.hidePassword` | Hide password |
| `register.strength.empty` | Strength |
| `register.strength.weak` | Weak |
| `register.strength.fair` | Fair |
| `register.strength.good` | Good |
| `register.strength.strong` | Strong |
| `register.school` | School |
| `register.schoolPh` | Select your school |
| `register.department` | Department |
| `register.departmentPh` | Select your department |
| `register.departmentHelp` | Pick your school first. |
| `register.level` | Level |
| `register.levelPh` | Select your level |
| `register.optionalTag` | Optional |
| `register.consent` | I agree to Sabi's {privacy}. |
| `register.consentLink` | privacy policy |
| `register.submit` | Create account |
| `register.sending` | Dey create your account |
| `register.haveAccount` | Already get account? |
| `register.login` | Log in |
| `register.errorSummary` | Fix {n} things to continue |
| `register.errName` | Enter your full name, at least 2 letters. |
| `register.errEmail` | Enter a correct email address. |
| `register.errPassword` | Use at least 8 characters. |
| `register.errConsent` | Tick the box to continue. |
| `register.errTaken` | This email don dey registered. Try another one. |
| `register.errBusy` | The service dey busy. Try again in 30 seconds. |
| `register.errOffline` | You dey offline. Connect to data, then try again. |
| `register.dismiss` | Dismiss message |

### Log in

| Key | String |
|---|---|
| `login.kicker` | Na you again? |
| `login.title` | Welcome back, |
| `login.titleGold` | future star! |
| `login.lead` | Log in make we continue your FUTA journey. No wahala. |
| `login.email` | Email address |
| `login.emailPh` | e.g. yourname@gmail.com |
| `login.password` | Password |
| `login.passwordPh` | Enter your password |
| `login.showPassword` | Show password |
| `login.hidePassword` | Hide password |
| `login.forgot` | Forgot password? |
| `login.submit` | Log in |
| `login.sending` | Logging you in |
| `login.or` | Or |
| `login.noAccount` | Don't have an account? |
| `login.register` | Register |
| `login.errWrong` | Incorrect email or password. Try again, abeg. |
| `login.errEmail` | Enter a correct email address. |
| `login.errPassword` | Enter your password. |
| `login.errBusy` | The service dey busy. Try again in 30 seconds. |
| `login.errOffline` | You dey offline. Connect to data, then try again. |
| `login.errSession` | Your session don end. Log in again. |
| `login.registered` | Your account ready. Log in to continue. |
| `login.offlineTitle` | No data? No wahala! |
| `login.offlineBody` | You dey offline, but you fit still use Sabi for school info, map and more. |

### First-time sync

| Key | String |
|---|---|
| `sync.kicker` | First time here? |
| `sync.title` | Let's sync |
| `sync.titleGold` | your FUTA life! |
| `sync.lead` | We dey download all the important stuff for you: schools, departments, courses, timetables, buildings and notices. |
| `sync.savingTitle` | Saving to your phone |
| `sync.percent` | {n}% |
| `sync.syncing` | Syncing |
| `sync.items.schools` | Schools |
| `sync.items.departments` | Departments |
| `sync.items.courses` | Courses |
| `sync.items.timetables` | Timetables |
| `sync.items.buildings` | Buildings |
| `sync.items.notices` | Notices |
| `sync.keepUsingTitle` | You fit keep using Sabi |
| `sync.keepUsingBody` | while we finish the download. No dulling! |
| `sync.continue` | Continue without saving |
| `sync.whyTitle` | Why save first? |
| `sync.whyBody` | So you fit see your timetable, campus map and notices even when no data dey. Smart move, future you go thank you! |
| `sync.dataLine` | Uses about {size} of data. |
| `sync.wifi` | Wi-Fi better (e no be scam). |
| `sync.stateSyncingTitle` | Still syncing |
| `sync.stateSyncingBody` | Just a few more things. Keep your app open. |
| `sync.stateSyncingTag` | In progress |
| `sync.stateDoneTitle` | You're set! |
| `sync.stateDoneBody` | All your data don save. Go enjoy campus life! |
| `sync.stateDoneTag` | Completed |
| `sync.stateFailTitle` | Network no strong |
| `sync.stateFailBody` | We go try again. Check your connection or use Wi-Fi. |
| `sync.retry` | Retry |
| `sync.packTitle` | Add campus photos? |
| `sync.packBody` | About {size} of photos go make the app look like campus. E go download on Wi-Fi. You fit skip am. |
| `sync.packYes` | Download on Wi-Fi |
| `sync.packNo` | Not now |
| `sync.doneAction` | Start exploring |

### Settings

| Key | String |
|---|---|
| `settings.kicker` | Settings, na small adjustment, big difference! |
| `settings.title` | Settings |
| `settings.lead` | Make Sabi work better for you. No wahala, just smooth vibes. |
| `settings.profileEdit` | Edit profile |
| `settings.profileGuest` | Log in to add your department and level. |
| `settings.offlineTitle` | Offline data |
| `settings.lastSaved` | Last saved: {when} |
| `settings.check` | Check for updates |
| `settings.checking` | Dey check |
| `settings.upToDate` | Everything don update. |
| `settings.storage` | Storage used |
| `settings.storageValue` | {used} of {total} |
| `settings.storageHelp` | Sabi go drop photos first if space tight. |
| `settings.packTitle` | Photo pack |
| `settings.packBody` | Campus and building photos, so the app dey look like campus. |
| `settings.packWifi` | Only on Wi-Fi |
| `settings.packDownload` | Download now |
| `settings.packRemove` | Remove |
| `settings.packStop` | Stop |
| `settings.packStates.none` | Not downloaded. Screens dey show drawings. |
| `settings.packStates.downloading` | Dey download: {done} of {total} photos. |
| `settings.packStates.waiting` | Dey wait for Wi-Fi. E go start by itself. |
| `settings.packStates.ready` | {n} photos, {size}. On this phone. |
| `settings.packStates.lite` | Off in Lite mode. Lite no dey download photos. |
| `settings.packNote` | Photos never download on slow data or when your phone dey save data. |
| `settings.liteTitle` | Lite mode |
| `settings.liteBody` | Saves data by turning off pictures and motion. |
| `settings.liteWhy.saver` | On because your phone ask to save data. |
| `settings.liteWhy.setting` | On because you turn am on. |
| `settings.liteWhy.url` | On for this preview. |
| `settings.creditsTitle` | Photo credits |
| `settings.creditsBody` | See where the photos and map data come from. |
| `settings.languageTitle` | Language |
| `settings.languageBody` | Pidgin (na our own) |
| `settings.aboutTitle` | About |
| `settings.aboutBody` | Version {version}. Unofficial app, not affiliated with FUTA. |
| `settings.privacyTitle` | Sabi's privacy policy |
| `settings.privacyBody` | How Sabi handle your data. |
| `settings.logout` | Log out |
| `settings.logoutBody` | Safe exit, no drama. |
| `settings.version` | 1.0.0 (design) |

### Photo credits

| Key | String |
|---|---|
| `credits.kicker` | Shoutout to the real ones! |
| `credits.title` | Photo credits |
| `credits.lead` | These are the photos and map data we use in Sabi. Big thanks to the people wey take am. |
| `credits.used` | Used on: {where} |
| `credits.author` | Photographer: {author} |
| `credits.source` | File page |
| `credits.licence` | Licence: {licence} |
| `credits.mapTitle` | Map data |
| `credits.mapBody` | © OpenStreetMap contributors. Open Database Licence (ODbL). |
| `credits.mapLink` | openstreetmap.org/copyright |
| `credits.iconsTitle` | Icons |
| `credits.iconsBody` | Phosphor Icons, MIT licence. |
| `credits.fontsTitle` | Fonts |
| `credits.fontsBody` | Poppins (SIL Open Font Licence) and Yellowtail (Apache 2.0). |
| `credits.footer` | Same campus, different angles. |
| `credits.none` | No photo dey downloaded, so no credit to show. Download the photo pack in Settings. |
| `credits.pending` | Photo: Federal University of Technology, Akure (official Facebook page). Written permission pending. |
| `credits.placeholdersTitle` | Placeholders |
| `credits.placeholdersBody` | Some screens show drawings instead of photos. Those na placeholders, no real photo yet. We only show a photo here when we fit credit am. |
| `credits.attribution` | Photos shared under CC BY-SA 4.0 stay under the same licence. |

### Admin home

| Key | String |
|---|---|
| `admin.kicker` | Omo, admin no be small thing o! |
| `admin.title` | Admin centre |
| `admin.lead` | Manage notices, verify data, keep FUTA info sharp. |
| `admin.roleLine` | {role}, {scope} |
| `admin.changeRole` | Change role |
| `admin.tiles.publish.title` | Publish notice |
| `admin.tiles.publish.body` | Share important updates with your people. |
| `admin.tiles.mine.title` | My notices |
| `admin.tiles.mine.body` | View, edit or delete your published notices. |
| `admin.tiles.verify.title` | Verify data |
| `admin.tiles.verify.body` | Help keep FUTA info accurate. |
| `admin.tiles.role.title` | Your role |
| `admin.tiles.role.body` | {role}, {scope} |
| `admin.gateLoginTitle` | Log in to continue |
| `admin.gateLoginBody` | Admin tools need an account. |
| `admin.gateNotAdminTitle` | Admins only o |
| `admin.gateNotAdminBody` | This place na for department, school, SUG and super admins. Ask your department make dem give your account admin access. |
| `admin.sessionEnded` | Your session don end. Log in again to publish. |

### Publish notice

| Key | String |
|---|---|
| `publish.kicker` | Quick gist, make it clear. |
| `publish.title` | Publish a Notice |
| `publish.lead` | Post a notice and let the right people see am. No wahala. |
| `publish.fieldTitle` | Title |
| `publish.fieldTitleHint` | {n} / 200 |
| `publish.fieldMessage` | Message |
| `publish.fieldMessageHint` | {n} / 500 |
| `publish.fieldSendTo` | Send to |
| `publish.sendTo.everyone` | Everyone |
| `publish.sendTo.school` | My school |
| `publish.sendTo.department` | My department |
| `publish.sendToLocked` | You fit post to {scope} only. |
| `publish.fieldSource` | Source shown to students |
| `publish.fieldSourceHint` | Students go see "From {source}" on the notice. |
| `publish.fieldExpires` | Expires (optional) |
| `publish.fieldExpiresHint` | Your phone time. Leave am empty for no expiry. |
| `publish.preview` | Preview |
| `publish.previewTo` | To: {audience} |
| `publish.publish` | Publish notice |
| `publish.publishing` | Dey publish |
| `publish.published` | Notice published successfully! |
| `publish.publishedBody` | Students go get this one see am now. |
| `publish.publishedAgain` | Publish another |
| `publish.publishedView` | See my notices |
| `publish.errTitle` | Give the notice a title, at least 3 letters. |
| `publish.errMessage` | Write the message. |
| `publish.errSend` | You no fit post to this scope. |
| `publish.errSession` | Your session don end. Log in again to publish. |
| `publish.errBusy` | The service dey busy. Try again in 30 seconds. |
| `publish.errOffline` | You dey offline. Connect to data to publish. |
| `publish.plainText` | Plain text only. E dey go live straight away. |

### My notices

| Key | String |
|---|---|
| `myNotices.kicker` | Your posts |
| `myNotices.title` | My Notices |
| `myNotices.filters.all` | All |
| `myNotices.filters.published` | Published |
| `myNotices.filters.drafts` | Drafts |
| `myNotices.status.published` | Published |
| `myNotices.status.draft` | Draft |
| `myNotices.to` | To: {audience} |
| `myNotices.edit` | Edit |
| `myNotices.delete` | Delete |
| `myNotices.confirmTitle` | Delete this notice? |
| `myNotices.confirmBody` | Students go stop to see am. This action no fit undo. |
| `myNotices.confirmYes` | Delete |
| `myNotices.confirmNo` | Cancel |
| `myNotices.deleted` | Notice deleted. |
| `myNotices.emptyTitle` | You never post any notice |
| `myNotices.emptyBody` | When you publish one, e go show here. |
| `myNotices.emptyAction` | Publish notice |
| `myNotices.loading` | Dey load your notices |
| `myNotices.errorTitle` | We no fit read your notices |
| `myNotices.errorBody` | Try again. Nothing don commot. |
| `myNotices.retry` | Try again |

### Verify data

| Key | String |
|---|---|
| `verify.kicker` | Check am well, make am real. |
| `verify.title` | Verify Data |
| `verify.lead` | New info dey queue. Verify the ones wey no get green tick yet. |
| `verify.filters.all` | All |
| `verify.filters.buildings` | Buildings |
| `verify.filters.departments` | Departments |
| `verify.filters.courses` | Courses |
| `verify.filters.lecturers` | Lecturers |
| `verify.source` | Source: {source} |
| `verify.added` | Added {date} |
| `verify.action` | Verify |
| `verify.detailTitle` | Check this record |
| `verify.sourceChecked` | Source you checked |
| `verify.sourceHint` | Where you confirm am, in plain words. Students go see this. |
| `verify.markVerified` | Mark verified |
| `verify.markOutdated` | Mark outdated |
| `verify.needSource` | Add the source you check before you mark am verified. |
| `verify.verifiedTitle` | Verified! |
| `verify.verifiedBody` | This record don dey live on Sabi, and e carry your name and the date. |
| `verify.verifiedBy` | Verified by: {who} |
| `verify.back` | Back to queue |
| `verify.emptyTitle` | Nothing to verify |
| `verify.emptyBody` | Your queue don clean. You don try! |
| `verify.offlineTitle` | You dey offline |
| `verify.offlineBody` | We no fit verify data without internet. Breathe, connect and try again. |
| `verify.retry` | Try again |
| `verify.queueCount` | {n} waiting |
| `verify.loading` | Dey load the queue |
| `verify.onlyYours` | You fit verify only records wey belong to {scope}. |

### Your role

| Key | String |
|---|---|
| `role.kicker` | Know your power |
| `role.title` | Role and permissions |
| `role.lead` | Here na wetin you fit publish and verify. |
| `role.yourRole` | Your role |
| `role.roleHelp` | You dey here to support {scope}. Make we do am well! |
| `role.canTitle` | What you fit publish to |
| `role.can.department` | All departments in your school |
| `role.can.school` | Your school, full access |
| `role.can.everyone` | Everyone (University) |
| `role.cannot` | All schools (not allowed) |
| `role.allowed` | Allowed |
| `role.notAllowed` | Not allowed |
| `role.roles.department_admin` | Department admin |
| `role.roles.faculty_admin` | School admin |
| `role.roles.sug` | SUG |
| `role.roles.super_admin` | Super admin |
| `role.why` | Roles come from the server. Sabi cannot give you more power. |

### Empty, error and offline states

| Key | String |
|---|---|
| `states.offlineBanner` | You dey offline. Sabi dey show wetin you don save. |
| `states.syncFailedBanner` | We no fit finish saving. We go try again when your network better. |
| `states.busy` | The service dey busy. Try again in 30 seconds. |
| `states.retry` | Try again |
| `states.offlineTitle` | No data? No wahala! |
| `states.offlineBody` | Sabi still dey work. School info, map and timetable dey your phone. |
| `states.loadingTitle` | Dey load |
| `states.notFoundTitle` | We no see am |
| `states.notFoundBody` | E fit don commot or e never dey saved on this phone. |
| `states.errorTitle` | Something spoil small |
| `states.errorBody` | Try again. If e still no work, restart Sabi. |
| `states.noMatchTitle` | Nothing match |
| `states.noMatchBody` | Try another word. |
| `states.storageFullTitle` | Phone space don tight |
| `states.storageFullBody` | Sabi don drop the photo pack first. Your saved data still dey. |

### Prototype only (not part of the app)

| Key | String |
|---|---|
| `proto.bar` | Prototype |
| `proto.state` | State |
| `proto.lite` | Lite mode |
| `proto.pack` | Photo pack |
| `proto.index` | All screens |
| `proto.sample` | Sample data |
| `proto.sampleHelp` | Names, times, counts and statuses on these screens are made up, except OpenStreetMap place names and photo credits. |
| `proto.packs.ready` | Downloaded |
| `proto.packs.none` | Not downloaded |
| `proto.packs.downloading` | Downloading |
| `proto.packs.waiting` | Waiting for Wi-Fi |
| `proto.lites.auto` | Follow phone |
| `proto.lites.on` | On |
| `proto.lites.off` | Off |
| `proto.states.default` | Normal |
| `proto.states.loading` | Loading |
| `proto.states.empty` | Empty |
| `proto.states.error` | Error |
| `proto.states.offline` | Offline |
| `proto.states.syncFailed` | Sync failed |
| `proto.states.done` | Finished |
| `proto.states.noDept` | No department yet |
| `proto.states.invalid` | Field errors |
| `proto.states.sending` | Sending |
| `proto.states.wrong` | Wrong password |
| `proto.states.taken` | Email taken |
| `proto.states.busy` | Busy (503) |
| `proto.states.session` | Session ended (401) |
| `proto.states.confirm` | Delete confirm |
| `proto.states.published` | Published |
| `proto.states.verified` | Verified |
| `proto.states.detail` | Department open |
| `proto.states.searchEmpty` | No match |
| `proto.states.notFound` | Not saved |
| `proto.states.notAdmin` | Not an admin |
| `proto.states.signedOut` | Signed out |
| `proto.states.drafts` | Drafts |
| `proto.states.downloading` | Downloading |
| `proto.states.waiting` | Waiting for Wi-Fi |
| `proto.states.ready` | Ready |
| `proto.states.none` | None |
| `proto.states.lite` | Lite on |
| `proto.states.menu` | Profile menu open |
| `proto.states.noPhoto` | No photo |
| `proto.states.unread` | Unread |
| `proto.pages.welcome` | Welcome |
| `proto.pages.home` | Home |
| `proto.pages.map` | Campus map |
| `proto.pages.place` | Place detail |
| `proto.pages.academics` | Academics |
| `proto.pages.timetable` | Timetable |
| `proto.pages.notices` | Notices |
| `proto.pages.notice` | Notice detail |
| `proto.pages.register` | Register |
| `proto.pages.login` | Log in |
| `proto.pages.sync` | First-time sync |
| `proto.pages.settings` | Settings |
| `proto.pages.credits` | Photo credits |
| `proto.pages.admin` | Admin home |
| `proto.pages.publish` | Publish notice |
| `proto.pages.mynotices` | My notices |
| `proto.pages.verify` | Verify data |
| `proto.pages.role` | Your role |
| `proto.pages.states` | Empty, error, offline |
| `proto.pages.components` | Components |
| `proto.group.app` | The app |
| `proto.group.admin` | Admin (from the profile icon) |
| `proto.group.system` | States and components |
| `proto.indexTitle` | Sabi prototypes |
| `proto.indexLead` | Built from the approved mockups. Open any screen, then use the Prototype button to switch its state, theme, Lite mode and photo pack. |
