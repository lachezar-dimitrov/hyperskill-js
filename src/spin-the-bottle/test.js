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
                else
                    return (
                        nodeNames &&
                        !nodeNames.includes(element.nodeName.toLowerCase())
                    );
            };

            // method to check if element with id has right text
            this.elementHasText = (id, correctText) => {
                const element = document.body.querySelector(id);
                if (!element) return true;

                if (correctText) {
                    return !element.innerText.includes(correctText);
                }

                return (
                    !element.innerText || element.innerText.trim().length === 0
                );
            };

            // method to check if element with id has right attribute
            this.elementHasAttribute = (id, attribute, value) => {
                const element = document.body.querySelector(id);
                if (!element) return true;
                const attributeValue = element.getAttribute(attribute);
                if (!attributeValue) return true;
                if (value) return attributeValue !== value;
                return false;
            };

            // method to add player
            this.addPlayer = async (playerName) => {
                const input = document.body.querySelector("#player-name");
                if (!input) return false;
                input.value = playerName;
                const addPlayer = document.body.querySelector("#add-player");
                if (!addPlayer) return false;
                await addPlayer.click();
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
                if (tagAlt)
                    return `${theElement} "${id}" should be a/an ${tag} or ${tagAlt} tag.`;
                else return `${theElement} "${id}" should be a/an ${tag} tag.`;
            };
            this.wrongTextMsg = (id, text) => {
                return `${theElement} "${id}" should have the text: "${text}".`;
            };
            this.wrongAttributeMsg = (id, attribute, value) => {
                return `${theElement} "${id}" should have the attribute "${attribute}" with the value "${value}".`;
            };
            this.missingAttributeMsg = (id, attribute) => {
                return `${theElement} "${id}" should have the attribute "${attribute}".`;
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
            const h1Text = "Spin The Bottle";
            if (this.elementHasText(h1, h1Text))
                return wrong(this.wrongTextMsg(h1, h1Text));

            // check #players-text exists
            const playersText = "#players-text";
            if (this.elementExists(playersText))
                return wrong(this.missingIdMsg(playersText));

            // check if its p tag
            if (this.elementExists(playersText, ["p"]))
                return wrong(this.wrongTagMsg(playersText, "p"));

            // check if it has text
            const playersTextValue = "Players";
            if (this.elementHasText(playersText, playersTextValue))
                return wrong(this.wrongTextMsg(playersText, playersTextValue));

            // check if #players exists
            const players = "#players";
            if (this.elementExists(players))
                return wrong(this.missingIdMsg(players));

            // check if its ul or ol tag
            if (this.elementExists(players, ["ul", "ol"]))
                return wrong(this.wrongTagMsg(players, "ul", "ol"));

            /*  // check if #players has 6 li
          const playersList = document.body.querySelector(players);
          if (playersList.children.length !== 6) return wrong("There should be 6 players in the list.");

          // check if all players have text
          for (let i = 1; i <= 6; i++) {
              const playerSelector = `#players li:nth-of-type(${i})`;
              if (this.elementHasText(playerSelector)) return wrong(this.wrongTextMsg(playerSelector, "Player " + i));
          }*/

            // check if #status exists
            const status = "#status";
            if (this.elementExists(status))
                return wrong(this.missingIdMsg(status));

            // check if its p tag
            if (this.elementExists(status, ["p"]))
                return wrong(this.wrongTagMsg(status, "p"));

            // check if it has text
            const statusText = "Add players to spin the bottle.";
            if (this.elementHasText(status, statusText))
                return wrong(this.wrongTextMsg(status, statusText));

            // check if #spin exists
            const spin = "#spin";
            if (this.elementExists(spin)) return wrong(this.missingIdMsg(spin));

            // check if its button
            if (this.elementExists(spin, ["button"]))
                return wrong(this.wrongTagMsg(spin, "button"));

            // check if it has text
            const spinText = "Spin";
            if (this.elementHasText(spin, spinText))
                return wrong(this.wrongTextMsg(spin, spinText));

            return correct();
        }),
        this.page.execute(async () => {
            // test #3
            // STAGE3 FORM TAGS

            // check if form exists
            if (this.elementExists("form"))
                return wrong(this.missingIdMsg("form"));

            // check label exists in form
            if (this.elementExists("form label"))
                return wrong(this.missingIdMsg("form label"));

            // check label has correct for attr
            if (this.elementHasAttribute("form label", "for", "player-name"))
                return wrong(
                    this.wrongAttributeMsg("form label", "for", "player-name"),
                );

            // check label has correct text
            if (this.elementHasText("form label", "Enter player name"))
                return wrong(
                    this.wrongTextMsg("form label", "Enter player name"),
                );

            // check input exists in form
            if (this.elementExists("form #player-name"))
                return wrong(this.missingIdMsg("form #player-name"));

            // check input has correct placeholder attr
            if (
                this.elementHasAttribute(
                    "form #player-name",
                    "placeholder",
                    "Player name",
                )
            )
                return wrong(
                    this.wrongAttributeMsg(
                        "form label",
                        "placeholder",
                        "Player name",
                    ),
                );

            // check #add-player button exists in form
            if (this.elementExists("form #add-player"))
                return wrong(this.missingIdMsg("form #add-player"));

            // check #add-player button has correct text
            if (this.elementHasText("form #add-player", "Add player"))
                return wrong(
                    this.wrongTextMsg("form #add-player", "Add player"),
                );

            return correct();
        }),
        this.page.execute(async () => {
            // test #4
            // STAGE3 ADD PLAYER

            // enter player name
            const playerName = "John";
            const input = document.body.querySelector("#player-name");
            if (!input) return wrong("The input element is missing.");

            input.value = playerName;

            await new Promise((resolve) => setTimeout(resolve, 1000));

            // click add player
            const addPlayer = document.body.querySelector("#add-player");
            if (!addPlayer) return wrong("The add player button is missing.");

            await addPlayer.click();

            await new Promise((resolve) => setTimeout(resolve, 1000));

            // check if player is added
            const players = Array.from(
                document.querySelectorAll("#players li"),
            );
            if (
                !players.some((player) =>
                    player.textContent.includes(playerName),
                )
            )
                return wrong(
                    "The player should be added to the list of players.",
                );

            // check if status text is updated
            const status = document.body.querySelector("#status");
            if (!status) return wrong("The status element is missing.");

            if (this.elementHasText("#status", "Spin the bottle!"))
                return wrong(
                    "The status text should change after adding a player.",
                );

            return correct();
        }),
        this.page.execute(async () => {
            // test #5
            // STAGE3 SPIN BUTTON CLICK

            // check if input clears after adding player
            const input = document.body.querySelector("#player-name");
            if (!input) return wrong("The input element is missing.");

            if (input.value !== "")
                return wrong(
                    "The input element should clear after adding a player.",
                );

            // add player
            await this.addPlayer("Jane");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // check if a player already exist, it should not be added again
            await this.addPlayer("Jane");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            let players = Array.from(document.querySelectorAll("#players li"));
            if (
                players.filter((player) => player.textContent.includes("Jane"))
                    .length > 1
            )
                return wrong(
                    "The same player should not be added more than once.",
                );

            // status text should say "Player already exists"
            let status = document.body.querySelector("#status");
            if (!status) return wrong("The status element is missing.");

            if (this.elementHasText("#status", "Player already exists"))
                return wrong(
                    'The status text should display "Player already exists!" if the player already exists.',
                );

            await this.addPlayer("Alice");
            await new Promise((resolve) => setTimeout(resolve, 1000));

            // check if spin button works
            const spin = document.body.querySelector("#spin");
            if (!spin) return wrong("The spin button is missing.");

            await spin.click();

            status = document.body.querySelector("#status");

            let text = "Spinning...";
            if (this.elementHasText("#status", text))
                return wrong(
                    this.wrongTextMsg("#status", text) +
                        "for 2 seconds before selecting a player.",
                );

            await new Promise((resolve) => setTimeout(resolve, 3000));

            let statusText = status.innerText;
            let statusList = [statusText];
            players = Array.from(document.querySelectorAll("#players li"));

            if (
                !players.some((player) =>
                    statusText.includes(player.textContent),
                )
            )
                return wrong(
                    'The element with selector of "#status" should display the selected player.',
                );

            // check if its random
            await spin.click();
            await new Promise((resolve) => setTimeout(resolve, 3000));
            statusList.push(status.innerText);

            await spin.click();
            await new Promise((resolve) => setTimeout(resolve, 3000));
            statusList.push(status.innerText);

            if (
                statusList[0] === statusList[1] &&
                statusList[1] === statusList[2]
            )
                return wrong("The selected player should be random.");

            await new Promise((resolve) => setTimeout(resolve, 3000));

            return correct();
        }),
    ];
}

it("Test stage", async () => {
    await new Test().runTests();
}).timeout(30000);
