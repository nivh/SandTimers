let MAX_SESSIONS = 5;
let targetTime: number;
//let timersArray: SandTimer[] = [];
let uiTimersArrayGroup: SandTimersGroup;
let solutionsArray: State[] = [];
let totalStates = 0;
let totalAttempts = 0;

class SandTimer {
	private _duration: number;
	private _bottom: number;
	private _top: number
	constructor(duration: number) {
		this._duration = duration;
		this._bottom = duration;
		this._top = 0;
	};
	public copyFrom(srcTimer: SandTimer) {
		this._duration = srcTimer.getDuration();
		this._bottom = srcTimer.getBottom();
		this._top = srcTimer.getTop();
	}
	public getDuration(): number {
		return this._duration;
	};
	public getBottom(): number {
		return this._bottom;
	};
	public getTop(): number {
		return this._top;
	};
	public flip() {
		let temp: number = this._top;
		this._top = this._bottom;
		this._bottom = temp;
	};
	public activate(timePause: number) {
		// check if nothing to do (top==0)
		if (this._top === 0) {
			return;
		}
		// check if time pause
		if (timePause && timePause < this._top) {
			// run until time pause
			this._top -= timePause;
			this._bottom += timePause;
		} else {
			// run until sand ends
			this._bottom = this._duration;
			this._top = 0;
		}
	}
}

class SandTimersGroup {
	private _SandTimersArray: SandTimer[] = [];
	public addFromOtherSandTimer(theSandTimer: SandTimer): void {
		let newTimer = new SandTimer(theSandTimer.getDuration());
		newTimer.copyFrom(theSandTimer);
		this._SandTimersArray.push(theSandTimer);
	};
	public addSandTimer(duration: number): void {
		let newTimer = new SandTimer(duration);
		this._SandTimersArray.push(newTimer);
		// keep timers sorted from big to small
		//this.sort();
	}
	public deleteAllTimers(): void {
		this._SandTimersArray.length = 0;
	}
	public removeSandTimerByIndex(timerIndex: number) {
		this._SandTimersArray.splice(timerIndex - 1, 1);
	}
	public getArrayCopy(): SandTimer[] {
		// return Object.assign([], this._SandTimersArray); // clone the array
		return [...this._SandTimersArray];
	}
	public sort(): void {
		this._SandTimersArray.sort((a: SandTimer, b: SandTimer) => {
			return (b.getDuration() - a.getDuration());
		})
	}
}

class State {
	sandTimersGroup: SandTimersGroup; // the group of sand timers
	timers: SandTimer[];
	minutesPassed: number;
	flips: number;
	sessions: number;
	parentState: State | null;
	childStates: State[];
	totalMidStops: number;
	constructor(timers: SandTimer[], minutesPassed: number, numberOfFlips: number, numberOfSessions: number, numberOfMidStates: number, parentState: State | null) {
		this.sandTimersGroup = new SandTimersGroup();
		this.timers = timers;
		this.minutesPassed = minutesPassed;
		this.flips = numberOfFlips;
		this.sessions = numberOfSessions;
		this.parentState = parentState;
		this.childStates = [];
		this.totalMidStops = numberOfMidStates;
	}
}

// function addTimer(duration: number) {
// 	let newTimer = new SandTimer(duration);
// 	timersArray.push(newTimer);
// 	// keep timers sorted from big to small
// 	timersArray.sort((a, b) => {
// 		return (b.getDuration() - a.getDuration());
// 	})
// }

function clearLog() {
	let outputDiv = document.getElementById('outputDiv');
	if (!outputDiv) {
		throw new Error("Could not find HTML element");
	}
	outputDiv.innerHTML = "";
}

function logText(text: string, color?: string) {
	let outputDiv = document.getElementById('outputDiv');
	if (!outputDiv) {
		throw new Error("Could not find HTML element");
	}
	let newText = text;
	if (color) {
		newText = `<span style='color:${color}'>${newText}</span>`;
	}
	outputDiv.innerHTML += newText + "<br />";
}

function printStatePath(state: State) {
	// prints the states path until here (all the parents one one top of the other)
	// build state path:
	let path: State[] = [];
	path.push(state);
	while (state.parentState) {
		state = state.parentState;
		path.push(state);
	}
	// go over the path print it
	while (path.length > 0) {
		let curState: State | undefined = path.pop();
		if (!curState) {
			break;
		}
		printState(curState);
	}
}

function printBestSolution() {

	
	if (totalStates <= 0) {
		console.error('no states!');
		return;
	}
	if (totalAttempts <=0) {
		console.error('no attempts!');
		return;
	}
	if (solutionsArray.length <= 0) {
		logText(`${totalStates} tries, No solutions!`, "blue");
		return;
	}
	logText(`Total Attempts: ${totalAttempts}`, "purple");
	logText(`Total States: ${totalStates}`, "purple");
	let percent = solutionsArray.length / totalAttempts * 100;
	logText(`Found ${solutionsArray.length} solutions out of ${totalAttempts} attempts. (${percent}%) (the smaller the better)`, "blue");


	logText(`best solution:`, "green");
	// find the best solution
	let bestPath = solutionsArray[0];
	solutionsArray.forEach((state) => {
		if (state.sessions < bestPath.sessions) {
			bestPath = state;
		} else if (state.flips < bestPath.flips) {
			bestPath = state;
		}
	})
	logText(`${bestPath.totalMidStops} mid stops total`);
	printStatePath(bestPath);
}

function printState(State: State, indent?: number) {
	if (!indent || indent == null) {
		indent = 0;
	}
	let newText = `(${State.sessions}) ${State.minutesPassed} mins `;
	newText = Array(indent).join('--') + newText;
	State.timers.forEach((t) => {
		newText += ' ' + t.getTop() + '/' + t.getBottom();
	})
	newText += ` (${State.flips} flips)`;
	newText += ` (${State.totalMidStops} total mid-way stops)`;
	let color = "black";
	if (State.minutesPassed === targetTime) {
		newText += ' Reached Target!!!!!!!!!!!!!';
		color = 'green';
	} else if (State.minutesPassed > targetTime) {
		newText += ' miss target';
		color = 'red';
	}
	else if (State.sessions >= MAX_SESSIONS) {
		newText += ' max sessions reached';
		color = 'purple';
	}
	logText(newText, color);
}

function printStatesTree(rootState: State) {
	var indent = 1;
	// recursive function:
	function printNode(node: State) {
		printState(node, indent);
		if (node.childStates) {
			indent++;
			node.childStates.forEach((n) => {
				printNode(n);
				indent--;
			})

		}
	}
	printNode(rootState);
}

function showTimers() {

	let htmlDiv = document.getElementById('sandTimersDiv');
	if (!htmlDiv) {
		throw new Error("Could not find HTML element");
	}
	htmlDiv.innerHTML = "";
	uiTimersArrayGroup.getArrayCopy().forEach((t, i) => {
		let newDiv = document.createElement("div");
		let index = i + 1;
		let newContent = document.createTextNode(`${index}) ${t.getTop()}/${t.getBottom()} `);
		newDiv.appendChild(newContent);
		newDiv.setAttribute('id', 'timer-id-div' + index);
		let newButton = document.createElement('button');
		newButton.appendChild(document.createTextNode('Remove'));
		newButton.setAttribute('onClick', `onRemoveTimer(\'${index}\')`);
		newDiv.appendChild(newButton);
		if (!htmlDiv) {
			throw new Error("Could not find HTML element");
		}
		htmlDiv.appendChild(newDiv);

	})
}

// function clearTimers() {
// 	timersArray = [];
// }

// recursive function to build the states tree
function buildStatesBranch(aState: State, justFlow: boolean = false) {
	totalStates++;
	// stop conditions:
	if (aState.sessions >= MAX_SESSIONS) {
		//logText('Reached max sessions');
		totalAttempts++;
		return;
	}
	if (aState.minutesPassed > targetTime) {
		//console.log('passed target time');
		totalAttempts++;
		return;
	}
	if (aState.minutesPassed === targetTime) {
		// reached target!
		//logText('reached goal!');
		totalAttempts++;
		solutionsArray.push(aState);
		return;
	}

	// check if just flow, and then just let it "go"
	if (justFlow) {
		let minimumTime = Number.MAX_VALUE; // find the minimum time after the flips
		aState.timers.forEach((t) => {
			if (minimumTime > t.getTop() && t.getTop() > 0) {
				minimumTime = t.getTop();
			}
		})
		if (minimumTime < Number.MAX_VALUE) {
			// top parts found, create a new state just to let them run
			// copy the sand timers:
			let newTimers: SandTimer[] = [];
			let newMidWayStops = 0;
			aState.timers.forEach((t) => {
				let newT = new SandTimer(t.getDuration());
				newT.copyFrom(t);
				newT.activate(minimumTime); // drain that timer
				// count midway timers:
				if (newT.getTop() > 0 && newT.getBottom() > 0) {
					newMidWayStops++;
				}
				newTimers.push(newT);
			});
			let newState = new State(newTimers, aState.minutesPassed + minimumTime, aState.flips, aState.sessions + 1, aState.totalMidStops + newMidWayStops, aState);
			aState.childStates.push(newState);
			// recursive call:
			buildStatesBranch(newState, false);
		}
		return;
	}

	// findAvailableMoves:
	let numOfSandtimers = aState.timers.length;
	// integer to hold maximum binary value:
	let maxInt = Math.pow(2, numOfSandtimers) - 1;
	// string to hold zeroes:
	var zerosStr = new Array(numOfSandtimers + 1).join('0');
	// go over all the numbers to find all binary options to flip the sand timers:
	for (let i = 1; i <= maxInt; i++) {
		let base2 = (i).toString(2);
		//logText(i+'='+base2);
		let fullBinary = zerosStr.substr(base2.length) + base2;
		//let newTimers = iterationCopy(aState.timers); // copy current timers
		let newTimers: SandTimer[] = [];
		// copy the sand timers:
		aState.timers.forEach((t) => {
			let newT = new SandTimer(t.getDuration());
			newT.copyFrom(t);
			newTimers.push(newT);
		});
		// go over the binary string:
		let numOfFlips = 0;
		for (let j = 0; j < numOfSandtimers; j++) {
			if (fullBinary[j] === '1') {
				// timer flip
				newTimers[j].flip();
				numOfFlips++;
			}
		}

		let newState = new State(newTimers, aState.minutesPassed, aState.flips + numOfFlips, aState.sessions, aState.totalMidStops, aState);
		aState.childStates.push(newState);
		// recursive call:
		buildStatesBranch(newState, true);
	}
}


// const wait = (ms: number) => {
// 	return new Promise((resolve: any) => setTimeout(resolve, ms));
// }



/////////////////////////////////////////////////////////////
// event handlers
//////////////////////////
async function onRunAppButton() {
	targetTime = Number((<HTMLInputElement>document.getElementById('target-time-input')).value);
	MAX_SESSIONS = Number((<HTMLInputElement>document.getElementById('maximum-sessions-input')).value);
	let curState = new State(uiTimersArrayGroup.getArrayCopy(), 0, 0, 0, 0, null);
	solutionsArray = [];
	totalStates = 0;
	totalAttempts = 0;
	//printState(curState);
	clearLog();
	logText("Building possible solutions tree...", "blue");
	console.log("calculating tree...");
	// wait a while before calculating (unknown display problem)
	// await wait(10);
	buildStatesBranch(curState);

	//console.log(curState);
	clearLog();
	printBestSolution();

	logText("the search tree:", "brown");
	printStatesTree(curState);
}

function onClearTimers() {
	//clearTimers();
	uiTimersArrayGroup.deleteAllTimers();
	showTimers();
}

function onRemoveTimer(timerIndex: number) {
	//timersArray.splice(timerIndex - 1, 1);
	uiTimersArrayGroup.removeSandTimerByIndex(timerIndex);
	//let elementId="timer-id-div"+timerIndex;
	//var itemToRemove = document.getElementById(elementId);
	//itemToRemove.parentNode.removeChild(itemToRemove);
	showTimers();
}

function onAddSandTimerClick() {
	let newSandTimer = Number((<HTMLInputElement>document.getElementById("add-timer-input")).value);
	if (newSandTimer <= 0) {
		alert('Please insert values bigger then 0!');
		return;
	}
	//addTimer(newSandTimer);
	uiTimersArrayGroup.addSandTimer(newSandTimer);
	showTimers();
}

window.onload = function () {
	uiTimersArrayGroup = new SandTimersGroup();
	uiTimersArrayGroup.addSandTimer(4);
	uiTimersArrayGroup.addSandTimer(7);
	//addTimer(4);
	//addTimer(7);
	showTimers();
	var input = document.getElementById("add-timer-input");
	if (!input) {
		throw new Error("Could not find the HTML element 'add-timer-input'")
	}
	input.addEventListener("keyup", function (event) {
		if (event.keyCode === 13) {
			event.preventDefault();
			onAddSandTimerClick();
		}
	});
};
