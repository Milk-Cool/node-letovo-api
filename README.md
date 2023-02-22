# Letovo API
**Not all methods are fully described, refer to https://s-api.letovo.ru/api/documentation for more information.**

## Installation
In your project directory:
```bash
npm i letovo-api
```
Then you can include it in a file like this:
```js
const Letovo = require("letovo-api");
```

## Usage
Here's how you get your marks using the API:
```js
const Letovo = require("letovo-api");

(async () => {
	const me = new Letovo("USERNAME", "PASSWORD");
	await me.login();
	console.log(me.userID, me.studentID);
	console.log((await me.marks()).data);
})();
```
More methods can be found below.

## Methods

#### `Letovo(user, password, immediateAuth = false)`
Creates a Letovo instance.
* `user` - your username in format `20XXlastname.fm`
* `password` - your password
* `immediateAuth` - if set to true, executes `Letovo.login` and `Letovo.loginOld` when created.

#### `letovo.studentID`
Student ID (number)

#### `letovo.userID`
User ID (number)

#### `letovo.oldStudentID`
student.letovo.ru student ID (number)

#### `async letovo.login()`
Logs in on s.letovo.ru

#### `async letovo.loginOld()`
Logs in on student.letovo.ru

#### `async letovo.logout()`
Logs out from s.letovo.ru

#### `async letovo.info()`
Returns info about the logged in user.
Format:
```json
{
  "user": {
    "id": ******,
    "name": "****",
    "email": "*************@student.letovo.ru",
    "user_type": "student",
    "is_email_verified": 1,
    "is_current_password": 1,
    "phone": "79*********",
    "parent_id": 0,
    "student_id": *****,
    "is_phone_verified": 0,
    "bad_pwd_count": 0,
    "is_blocked_by_badpwd_limit": 0,
    "bad_ad_pwd_count": 0,
    "is_disable": 0,
    "roles": []
  },
  "user_settings": {
    "id": ***,
    "user_id": ******,
    "language": "Ru",
    "tutorial_school_progress_done": 0,
    "widget_active_schedule": 1,
    "widget_active_schoolprogress": 1,
    "widget_active_favorites": 1,
    "active_qa_sections": [
      {
        "name_code": "diagnostics",
        "name_rus": "Диагностики",
        "name_eng": "Diagnostics",
        "options": "{\"allowed_user_types\": [\"parent\", \"student\"]}"
      },
      {
        "name_code": "olympiads",
        "name_rus": "Олимпиады",
        "name_eng": "Olympiads",
        "options": "{\"allowed_user_types\": [\"parent\", \"student\"]}"
      },
      {
        "name_code": "requests",
        "name_rus": "Запросы",
        "name_eng": "Requests",
        "options": "{\"allowed_user_types\": [\"parent\", \"student\"]}"
      },
      {
        "name_code": "schoolprogress",
        "name_rus": "Успеваемость",
        "name_eng": "Schoolprogress",
        "options": "{\"allowed_user_types\": [\"parent\", \"student\"]}"
      }
    ]
  }
}
```

#### `async letovo.sendVerificationCode()`
Sends the verification code for accessing extra information to your phone.

#### `async letovo.verifyPhone(code)`
Verifies your phone with the provided code.

#### `async letovo.daySchedule(day = today)`
Returns your schedule for a specific day. The argument `day` is of type Date().

#### `async letovo.weekSchedule(day = today)`
Returns your schedule for a specific day. The argument `day` is of type Date() (any day in week).

#### `async letovo.yearSchedule(day = today)`
Returns your schedule for a specific day. The argument `day` is of type Date() (any day in year).

#### `async letovo.diploma()`
Returns your current progress in Letovo Diploma.
Format:
```json
{
  "diploma_letovo_table": [
    { ... }
  ]
}
```

#### `async letovo.diplomaFuture()`
Returns all possible Letovo Diploma rewards.

#### `async letovo.olympiads()`
Returns all olympiads you participated in.

#### `async letovo.marks(period = currentPeriod)`
Returns your marks. Period is either `1` or `2`.
