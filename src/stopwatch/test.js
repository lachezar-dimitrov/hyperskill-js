import path from "path";
import { correct, StageTest, wrong } from "hs-test-web";

const pagePath = path.join(import.meta.url, "../../src/index.html");
class Test extends StageTest {
    page = this.getPage(pagePath);

    tests = [
        this.page.execute(() => {
            // test #1
            // HELPERS-->
            // method to check if element with id exists
            this.elementExists = (id, nodeNames) => {
                const element = document.body.querySelector(id);
                if (!element) return true;
                else return nodeNames && !nodeNames.includes(element.nodeName.toLowerCase());
            };

            // method to check if element with id has right text
            this.elementHasText = (id, correctText) => {
                const element = document.body.querySelector(id);
                if (!element) return true;

                if (correctText) {
                    return element.innerText !== correctText;
                }

                return !element.innerText || element.innerText.trim().length === 0;
            };

            // check if helpers still attached
            this.checkHelpers = () => {
                return true;
            };

            // CONSTANTS-->
            const theElement = "The element with the selector of";
            // <--CONSTANTS

            // MESSAGES-->
            this.missingIdMsg = (id) => {
                return `${theElement} "${id}" is missing in the body of the HTML document.`;
            };
            this.wrongTagMsg = (id, tag, tagAlt) => {
                if (tagAlt) return `${theElement} "${id}" should be a/an ${tag} or ${tagAlt} tag.`;
                else return `${theElement} "${id}" should be a/an ${tag} tag.`;
            };
            this.wrongTextMsg = (id, text) => {
                return `${theElement} "${id}" should have the text: "${text}".`;
            };
            // <--MESSAGES
            return correct();
        }),
        this.page.execute(() => {
            // test #2
            // STAGE1 TAGS

            // check if h1 exists
            const h1 = "h1";
            if (this.elementExists(h1)) return wrong(this.missingIdMsg(h1));

            // check if correct text
            const h1Text = "Simple Stopwatch";
            if (this.elementHasText(h1, h1Text)) return wrong(this.wrongTextMsg(h1, h1Text));

            // check #timer exists
            const timer = "#timer";
            if (this.elementExists(timer)) return wrong(this.missingIdMsg(timer));

            // check if its p tag
            if (this.elementExists(timer, ["p"])) return wrong(this.wrongTagMsg(timer, "p"));

            // check if it has text
            const timerText = "00:00:00";
            if (this.elementHasText(timer, timerText)) return wrong(this.wrongTextMsg(timer, timerText));

            // check if #start exists
            const start = "#start";
            if (this.elementExists(start)) return wrong(this.missingIdMsg(start));

            // check if its button
            if (this.elementExists(start, ["button"])) return wrong(this.wrongTagMsg(start, "button"));

            // check if it has text
            const startText = "Start";
            if (this.elementHasText(start, startText)) return wrong(this.wrongTextMsg(start, startText));

            // check if #stop exists
            const stop = "#stop";
            if (this.elementExists(stop)) return wrong(this.missingIdMsg(stop));

            // check if its button
            if (this.elementExists(stop, ["button"])) return wrong(this.wrongTagMsg(stop, "button"));

            // check if it has text
            const stopText = "Stop";
            if (this.elementHasText(stop, stopText)) return wrong(this.wrongTextMsg(stop, stopText));

            // check if #reset exists
            const reset = "#reset";
            if (this.elementExists(reset)) return wrong(this.missingIdMsg(reset));

            // check if its button
            if (this.elementExists(reset, ["button"])) return wrong(this.wrongTagMsg(reset, "button"));

            // check if it has text
            const resetText = "Reset";
            if (this.elementHasText(reset, resetText)) return wrong(this.wrongTextMsg(reset, resetText));

            // check if #lap exists
            const lap = "#lap";
            if (this.elementExists(lap)) return wrong(this.missingIdMsg(lap));

            // check if its button
            if (this.elementExists(lap, ["button"])) return wrong(this.wrongTagMsg(lap, "button"));

            // check if it has text
            const lapText = "Lap";
            if (this.elementHasText(lap, lapText)) return wrong(this.wrongTextMsg(lap, lapText));

            return correct();
        }),
        this.page.execute(async () => {
            // test #3
            // STAGE2 START BUTTON FUNCTIONALITY

            // check if #start button works
            const start = document.body.querySelector("#start");
            if (!start) return wrong(this.missingIdMsg("#start"));

            await start.click();

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 3000);
            });

            const timer = document.body.querySelector("#timer");
            const timerText = timer.innerText;
            if (timerText === "00:00:00") return wrong("Start button does not work.");

            return correct();
        }),
        this.page.execute(async () => {
            // test #4
            // STAGE2 STOP BUTTON FUNCTIONALITY

            // check if #stop button works
            const stop = document.body.querySelector("#stop");
            if (!stop) return wrong(this.missingIdMsg("#stop"));

            await stop.click();

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1000);
            });

            const timer = document.body.querySelector("#timer");
            const timerText = timer.innerText;
            if (timerText === "00:00:00") return wrong("Stop button does not work.");

            try {
                let [min, sec, ms] = timerText.split(":");
                if (sec[1] < 2) return wrong("Stop button does not work. Timer didn't stop after 2 seconds.");
            } catch (e) {
                return wrong(
                    "There was an error while parsing the timer text. Make sure it's in the format '00:00:00'.",
                );
            }

            return correct();
        }),
        this.page.execute(async () => {
            // test #5
            // STAGE2 RESUME AFTER CLICK START BUTTON AGAIN FUNCTIONALITY

            // check if #start button works
            const start = document.body.querySelector("#start");
            if (!start) return wrong(this.missingIdMsg("#start"));

            const timer = document.body.querySelector("#timer");
            const timerTextBefore = timer.innerText;
            let secBefore = Number(timerTextBefore.split(":")[1][1]);

            await start.click();

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1000);
            });

            const timerTextAfter = timer.innerText;
            let secAfter = Number(timerTextAfter.split(":")[1][1]);

            let message = "Timer should continue after clicking start button again.";

            if (timerTextAfter === timerTextBefore) return wrong(message);

            if (secBefore > secAfter) return wrong(message);

            return correct();
        }),
        this.page.execute(async () => {
            // test #6
            // STAGE3 LAP BUTTON FUNCTIONALITY

            // check if #laps exists
            const laps = document.body.querySelector("#laps");
            if (!laps) return wrong(this.missingIdMsg("#laps"));

            // check if it is ol or ul
            if (this.elementExists("#laps", ["ol", "ul"])) return wrong(this.wrongTagMsg("#laps", "ol", "ul"));

            // check if #lap button works
            const lap = document.body.querySelector("#lap");
            if (!lap) return wrong(this.missingIdMsg("#lap"));

            await lap.click();

            const timer = document.body.querySelector("#timer");
            const timerText = timer.innerText;

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1000);
            });

            // check if li exists
            const li = document.body.querySelector("#laps li");
            if (!li) return wrong(this.missingIdMsg("#laps li"));

            // check if it has text
            if (this.elementHasText("#laps li", timerText)) return wrong(this.wrongTextMsg("#laps li", timerText));

            return correct();
        }),
        this.page.execute(async () => {
            // test #7
            // STAGE3 RESET BUTTON FUNCTIONALITY

            // check if #reset button works
            const reset = document.body.querySelector("#reset");
            if (!reset) return wrong(this.missingIdMsg("#reset"));

            await reset.click();

            await new Promise((resolve) => {
                setTimeout(() => {
                    resolve();
                }, 1000);
            });

            const timer = document.body.querySelector("#timer");
            const timerText = timer.innerText;

            if (timerText !== "00:00:00") return wrong("Reset button does not work. Timer is not reset.");

            const laps = document.body.querySelector("#laps");
            if (laps.children.length !== 0) return wrong("Reset button does not work. Laps are not cleared.");

            return correct();
        }),
    ];
}

it("Test stage", async () => {
    await new Test().runTests();
}).timeout(30000);
