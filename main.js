


export function time(timestamp){
	const now = Date.now();
	const diff = now - timestamp;
	
	const msInHour = 1000 * 60 * 60;
	const msInDay = msInHour * 24;
	
	const date = new Date(timestamp);
	const hoursDiff = diff / msInHour;
	
	if (hoursDiff < 24) {
		// Format to HH:MM
		const hours = date.getHours().toString().padStart(2, '0');
		const minutes = date.getMinutes().toString().padStart(2, '0');
		return `${hours}:${minutes}`;
	} else if (hoursDiff < 48) {
		return "Yesterday";
	} else {
		// Format to MM/DD/YYYY
		const month = (date.getMonth() + 1).toString().padStart(2, '0');
		const day = date.getDate().toString().padStart(2, '0');
		const year = date.getFullYear();
		return `${month}/${day}/${year}`;
	}
}


export function getUserName(){
	
	const raw = localStorage.getItem("user-info");
	if(!raw){ return null; }
	const localUser = JSON.parse(raw);
	
	
	let user = {
		name: localUser.name,
		color: localUser.color,
	};
	return user;
}
export function setUserName(name,color){
	localStorage.setItem("user-info", JSON.stringify({
		name: name,
		color: color
	}));
}








