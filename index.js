// Implemented by Milk_Cool
// https://s-api.letovo.ru/api/documentation

const fetch = require("node-fetch");
const { DOMParser } = require("react-native-html-parser");

const runningInReactNative = typeof navigator !== "undefined" && navigator.product === "ReactNative";

class Letovo {
	// Constructor
	constructor(user, password, immediateAuth = false){
		this.user = user;
		this.password = password;
		this.token = "";
		this.PHPSESSID = "";
		this.parser = new DOMParser();
		if(immediateAuth){
			this.login();
			this.loginOld();
		}
	};
	studentID = "";
	oldStudentID = "";
	// JWT token stuff
	get decodedToken(){
		return JSON.parse(atob(this.token.split(" ")[1].split(".")[1]));
	};
	get fullDecodedToken(){
		let token = this.token.split(" ")[1].split(".");
		token[0] = JSON.parse(atob(token[0]));
		token[1] = JSON.parse(atob(token[1]));
		return token;
	};
	get userID(){
		return parseInt(this.decodedToken.sub);
	};
	// Basic req methods
	fetch(apiMethod = "", method = "POST", body = {}){
		if(typeof body != "string") body = JSON.stringify(body);
		const options = {
			"method": method,
			"headers": {
				"Authorization": this.token,
				"Content-Type": "application/json;charset=UTF-8"
			}
		};
		if(!["get", "head"].includes(method.toLowerCase())) options.body = body;
		return fetch("https://s-api.letovo.ru/api/" + apiMethod, options);
	};
	fetchOld(apiMethod = "", method = "POST", body = {}, headers = {}){
		if(typeof body != "string") body = (new URLSearchParams(body)).toString();
		const options = {
			"method": method,
			"headers": {
				"Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
				...headers
			},
			"credentials": "include"
		};
		if(!runningInReactNative)
			options.headers.Cookie = "PHPSESSID=" + this.PHPSESSID;
		if(!["get", "head"].includes(method.toLowerCase())) options.body = body;
		return fetch("https://student.letovo.ru/" + apiMethod, options);
	};
	req(apiMethod = "", method = "POST", body = {}){
		return new Promise((resolve, reject) => {
			this.fetch(apiMethod, method, body)
			.then(res => res.text()).then(res=>{
				try {
					res = JSON.parse(res);
				} catch(e) {
					res = { "error": e };
				}
				resolve(res);
			})
			.catch(reject);
		});
	};
	reqOld(apiMethod = "", method = "POST", body = {}, headers = {}){
		return new Promise((resolve, reject) => {
			this.fetchOld(apiMethod, method, body)
			.then(res => res.text()).then(resolve)
			.catch(reject);
		});
	};
	data(...args){
		return new Promise(resolve => this.req(...args).then(data => resolve(data.data)));
	};
	// Auth
	login(){
		return new Promise((resolve, reject) => {
			this.req("login", "POST", {
				"login": this.user,
				"password": this.password
			}).then(res => {
				if(res.code == 200) {
					this.token = res.data.token_type + " " + res.data.token;
					this.info().then(() => resolve(this.token)).catch(res => reject(res.message));
				} else reject(res.message);
			});
		});
	};
	logout(){
		return this.req("logout");
	};
	loginOld(){
		return new Promise(async resolve => {
			const f = await this.fetchOld("preferences_login.php", "POST", {
				"act": "logg",
				"key": "1",
				"login": this.user,
				"pass": this.password
			});
			if(!runningInReactNative) {
				const id = f.headers.get("Set-Cookie").match(/PHPSESSID=(?<id>[a-z0-9]+)/).groups.id;
				this.PHPSESSID = id;
			}
			f.json().then(res => resolve(this.oldStudentID = parseInt(res.message)));
		});
	}
	/*logoutOld(){
		return this.reqOld("logout", "GET");
	}*/ // TODO: fix
	info(){
		return new Promise(resolve => {
			this.data("me").then(res => {
				this.studentID = res.user.student_id;
				resolve(res);
			});
		});
	};
	sendVerificationCode(){
		return new Promise(resolve => {
			this.req("extaccesscodesend").then(res => resolve(res.code == 200 ? res.data.sent_to_phone : "ERROR " + res.message));
		});
	};
	verifyPhone(code){
		return new Promise(resolve => {
			this.req("extlogin", "POST", {
				"code": code
			}).then(res => resolve(res.code == 200 ? this.token = res.data.token_type + " " + res.data.token : "ERROR " + res.message));
		});
	};
	// Academical
	schedule(day, type = "day"){
		day = day || new Date();
		day = day.toISOString().split("T")[0];
		return new Promise(resolve => {
			this.fetch(`schedule/${this.studentID}/${type}?schedule_date=${day}`, "GET")
			.then(res => {
				if(res.status != 200) resolve(type == "year" ? {} : []);
				else res.json().then(x => resolve(x.data));
			});
		});
	};
	daySchedule(day){
		return this.schedule(day);
	};
	weekSchedule(day){
		return this.schedule(day, "week");
	};
	yearSchedule(day){
		return this.schedule(day, "year");
	};
	diploma(){
		return this.data(`diplomaletovo/${this.studentID}`, "GET");
	};
	diplomaFuture(year){
		if(!year) year = (new Date()).getFullYear();
		return this.data(`diplomaletovo/plan/${this.studentID}/${year}`, "GET");
	};
	olympiads(){
		return this.data(`olimpiadas/${this.studentID}`, "GET");
	};
	marks(period){
		if(!period) period = (new Date()).getMonth() < 7 ? 2 : 1;
		return this.data(`schoolprogress/${this.studentID}?period_num=${period}&filter_group_id=0`, "GET");
	};
	resetPassword(mail){
		return this.data(`sendresetpasscode?user_email=${encodeURI(mail)}`);
	};
	plan() {
		let day = new Date();
		day = day.toISOString().split("T")[0];
		return this.data(`academicplan/${this.studentID}?end_date=${day}`, "GET");
	};
	homework(day) { // s-api.letovo.ru does not show homework from the future, so we have to make requests to student.letovo.ru and parse the HTML output
		day = day || new Date();
		day = `${day.getDate().toString().padStart(2, "0")}.${(day.getMonth() + 1).toString().padStart(2, "0")}.${day.getFullYear()}.`;
		return new Promise(async (resolve, reject) => {
			await this.reqOld("home", "GET");
			await this.reqOld("index.php?r=student&part_student=diary&lang=eng", "GET");
			this.reqOld("index.php", "POST", {
				"date_report": day,
				"absence_report": "Show"
			})
			.then(res => {
				let o = [];
				let document = this.parser.parseFromString(res, "text/html");
				for(let i of Array.from(document.getElementByClassName("panel-group").childNodes).filter(x => x.attributes)) {
					i = i.childNodes[3].childNodes[1].childNodes[1];
					o.push([]);
					for(let j of Array.from(i.childNodes).filter(x => x.attributes).filter(x => !x.childNodes[1].getAttribute("class").includes("diary_cell_head"))) {
						o[o.length - 1].push({
							"name": j.childNodes[5].textContent?.trim(),
							"task": j.childNodes[9].textContent?.trim(),
							"link": j.childNodes[9].childNodes[1]?.childNodes[1]?.getAttribute("href")
						});
					}
				}
				resolve(o);
			})
			.catch(res => reject(res));
		});
	};
}

module.exports = Letovo;
