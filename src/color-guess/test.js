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

            // method to check the style of the element with id
            this.elementStyle = (id, style, value, strict = true) => {
                const element = document.body.querySelector(id);
                if (!element) return true;
                const styleValue = getComputedStyle(element)[style];
                // console.log(styleValue);
                if (!strict) return !styleValue.includes(value);
                return styleValue !== value;
            };

            // CONSTANTS-->
            const theElement = "The element with the selector of";
            this.bgColors = [
                "rgb(255, 0, 0)",
                "rgb(255, 255, 0)",
                "rgb(0, 255, 0)",
                "rgb(0, 255, 255)",
                "rgb(0, 0, 255)",
                "rgb(255, 0, 255)",
            ];
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
        this.page.execute(async () => {
            // test #2
            // STAGE1 TAGS

            // check if h1 exists
            const h1 = "h1";
            if (this.elementExists(h1)) return wrong(this.missingIdMsg(h1));

            // check if correct text
            const h1Text = "Color Guess Game";
            if (this.elementHasText(h1, h1Text)) return wrong(this.wrongTextMsg(h1, h1Text));

            // check #rgb exists
            const rgb = "#rgb-color";
            if (this.elementExists(rgb)) return wrong(this.missingIdMsg(rgb));

            // check if its p tag
            if (this.elementExists(rgb, ["p"])) return wrong(this.wrongTagMsg(rgb, "p"));

            // check if #status exists
            const status = "#status";
            if (this.elementExists(status)) return wrong(this.missingIdMsg(status));

            // check if its p tag
            if (this.elementExists(status, ["p"])) return wrong(this.wrongTagMsg(status, "p"));

            // check if it has text
            const statusText = "Start Guessing!";
            if (this.elementHasText(status, statusText)) return wrong(this.wrongTextMsg(status, statusText));

            // check if #restart exists
            const restart = "#restart";
            if (this.elementExists(restart)) return wrong(this.missingIdMsg(restart));

            // check if its button
            if (this.elementExists(restart, ["button"])) return wrong(this.wrongTagMsg(restart, "button"));

            // check if it has text
            const restartText = "Restart";
            if (this.elementHasText(restart, restartText)) return wrong(this.wrongTextMsg(restart, restartText));

            // check divs are 6
            const colorBlock = ".color-block";
            const colorBlocks = document.body.querySelectorAll(colorBlock);
            if (colorBlocks.length !== 6) return wrong("There should be 6 color blocks(divs).");

            // check if all color-block are divs
            for (let i = 0; i < colorBlocks.length; i++) {
                if (colorBlocks[i].nodeName.toLowerCase() !== "div") {
                    return wrong(`All color blocks should be divs.`);
                }
            }

            return correct();
        }),
        this.page.execute(async () => {
            // test #3
            // STAGE2 COLOR BLOCKS

            // check rgb-color has random rgb
            const rgbColor = document.body.querySelector("#rgb-color");
            if (!rgbColor) return wrong(this.missingIdMsg("#rgb-color"));

            const rgbColorText = rgbColor.innerText.toLowerCase();
            this.correctColor = rgbColorText;
            if (!rgbColorText.startsWith("rgb(") || !rgbColorText.endsWith(")")) {
                return wrong(
                    `The text of the element with the selector of "#rgb-color" should be in the format of "RGB(0, 0, 0)".`,
                );
            }

            // check if all color-blocks has different bg-color
            const colorBlocks = Array.from(document.body.querySelectorAll(".color-block"));
            const bgColors = colorBlocks.map((block) => getComputedStyle(block)["backgroundColor"]);

            for (let i = 1; i <= colorBlocks.length; i++) {
                let colorBlock = `.color-block:nth-of-type(${i})`;
                const colorBlockElement = document.body.querySelector(colorBlock);
                if (!colorBlockElement) return wrong(this.missingIdMsg(colorBlock));

                // check if color blocks are not the same from stage1
                if (!this.elementStyle(colorBlock, "backgroundColor", this.bgColors[i - 1])) {
                    return wrong(
                        `The color-block with the selector of "${colorBlock}" should not have the same background color from Stage 1.`,
                    );
                }

                const colorBlockBg = getComputedStyle(colorBlockElement)["backgroundColor"];
                const duplicates = bgColors.filter((bgColor) => bgColor === colorBlockBg).length;
                if (duplicates !== 1) {
                    return wrong(`All color blocks should have different background colors.`);
                }
            }

            // check if correct color exists
            const isCorrectColorExist = bgColors.filter((bgColor) => bgColor === rgbColorText);
            if (isCorrectColorExist.length !== 1) {
                return wrong(`The correct color should be one of the color blocks.`);
            }

            return correct();
        }),
        this.page.execute(async () => {
            // test #4
            // STAGE3 GAME LOGIC FAILURE

            // check if color block click works correctly
            // click on the wrong color block
            this.correctColorBlock = null;

            for (let i = 1; i <= 6; i++) {
                let colorBlock = `.color-block:nth-of-type(${i})`;
                const colorBlockElement = document.body.querySelector(colorBlock);
                if (!colorBlockElement) return wrong(this.missingIdMsg(colorBlock));

                // check if wrong color block disappears
                const colorBlockBg = colorBlockElement.style.backgroundColor;
                if (colorBlockBg !== this.correctColor) {
                    await colorBlockElement.click();
                    if (colorBlockElement.style.display !== "none") {
                        return wrong(`When the wrong color block is clicked, it should disappear.`);
                    }

                    // check if #status text is correct
                    if (this.elementHasText("#status", "Try Again!")) {
                        return wrong(
                            `When the wrong color block is clicked, the text of the element with the selector of "#status" should be "Try Again!"`,
                        );
                    }
                } else {
                    this.correctColorBlock = colorBlockElement;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            return correct();
        }),
        this.page.execute(async () => {
            // test #5
            // STAGE3 GAME LOGIC SUCCESS

            // check if color block click works correctly
            // click on the correct color block

            // getting the correct color
            const rgbColor = document.body.querySelector("#rgb-color");
            if (!rgbColor) return wrong(this.missingIdMsg("#rgb-color"));
            const rgbColorText = rgbColor.innerText.toLowerCase();
            this.correctColor = rgbColorText;

            if (!rgbColorText.startsWith("rgb(") || !rgbColorText.endsWith(")")) {
                return wrong(
                    `The text of the element with the selector of "#rgb-color" should be in the format of "RGB(0, 0, 0)".`,
                );
            }

            //const correctColorBlock = document.body.querySelector(`.color-block[style="background-color: ${this.correctColor};"]`);
            const correctColorBlockBg = getComputedStyle(this.correctColorBlock).backgroundColor;
            if (correctColorBlockBg !== this.correctColor) return wrong(`The correct color block should exist.`);

            await this.correctColorBlock.click();

            // check if #status text is correct
            if (this.elementHasText("#status", "Correct!")) {
                return wrong(
                    `When the correct color block is clicked, the text of the element with the selector of "#status" should be "Correct!"`,
                );
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));

            return correct();
        }),
        this.page.execute(async () => {
            // test #6
            // STAGE3 GAME RESTART

            // check if restart button works correctly
            const restartButton = document.body.querySelector("#restart");
            if (!restartButton) return wrong(this.missingIdMsg("#restart"));

            await restartButton.click();

            // check if #status text is correct
            if (this.elementHasText("#status", "Start Guessing!")) {
                return wrong(
                    `When the restart button is clicked, the text of the element with the selector of "#status" should be "Start Guessing!"`,
                );
            }

            // check if rgb-color has random rgb
            const rgbColor = document.body.querySelector("#rgb-color");
            if (!rgbColor) return wrong(this.missingIdMsg("#rgb-color"));

            const rgbColorText = rgbColor.innerText.toLowerCase();
            this.correctColor = rgbColorText;
            if (!rgbColorText.startsWith("rgb(") || !rgbColorText.endsWith(")")) {
                return wrong(
                    `The text of the element with the selector of "#rgb-color" should be in the format of "RGB(0, 0, 0)".`,
                );
            }

            // check if all color-blocks has different bg-color
            const colorBlocks = Array.from(document.body.querySelectorAll(".color-block"));
            const bgColors = colorBlocks.map((block) => getComputedStyle(block)["backgroundColor"]);

            for (let i = 1; i <= colorBlocks.length; i++) {
                let colorBlock = `.color-block:nth-of-type(${i})`;
                const colorBlockElement = document.body.querySelector(colorBlock);
                if (!colorBlockElement) return wrong(this.missingIdMsg(colorBlock));

                // check if color blocks are not the same from stage1
                if (!this.elementStyle(colorBlock, "backgroundColor", this.bgColors[i - 1])) {
                    return wrong(
                        `The color-block with the selector of "${colorBlock}" should not have the same background color from Stage 1.`,
                    );
                }

                const colorBlockBg = getComputedStyle(colorBlockElement)["backgroundColor"];
                const duplicates = bgColors.filter((bgColor) => bgColor === colorBlockBg).length;
                if (duplicates !== 1) {
                    return wrong(`All color blocks should have different background colors.`);
                }
            }

            // check if correct color exists
            const isCorrectColorExist = bgColors.filter((bgColor) => bgColor === rgbColorText);
            if (isCorrectColorExist.length !== 1) {
                return wrong(`The correct color should be one of the color blocks.`);
            }

            await new Promise((resolve) => setTimeout(resolve, 3000));

            return correct();
        }),
    ];
}

it("Test stage", async () => {
    await new Test().runTests();
}).timeout(60000);
