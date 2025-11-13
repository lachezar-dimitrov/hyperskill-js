import path from 'path';
import {correct, StageTest, wrong} from 'hs-test-web';

const pagePath = new URL("../src/index.html",import.meta.url ) // path.join(import.meta.url, '../../src/index.html');

class Test extends StageTest {

    page = this.getPage(pagePath)

    tests = [this.node.execute(async () => {
        // test #1
        // set viewport
        await this.page.open()
        await this.page.setViewport({width: 1024, height: 768})

        // Set zoom level to 100%
        await this.page.evaluate(() => {
            document.body.style.zoom = '100%';
        });

        return correct()
    }), this.page.execute(() => {
        // test #2
        // HELPERS-->
        // method to check if element with id exists
        this.elementExists = (id, nodeNames) => {
            const element = document.body.querySelector(id);
            if (!element) return true;
            else return (nodeNames && !nodeNames.includes(element.nodeName.toLowerCase()));
        };

        // method to check the style of the element with id
        this.elementStyle = (id, style, value, strict = true) => {
            let element = id;
            if (typeof id === "string") {
                element = document.body.querySelector(id);
            }
            if (!element) return true;
            let styleValue = getComputedStyle(element)[style];
            // console.log(styleValue);
            if (styleValue.includes('px')) {
                const numericValue = parseFloat(styleValue);
                styleValue = `${Math.round(numericValue)}px`;
            }
            if (!strict) return !styleValue.includes(value);
            return styleValue !== value;
        };

        // method to check if element with id has right text
        this.elementHasText = (id) => {
            let element = id;

            if (typeof id === "string") {
                element = document.body.querySelector(id);
            }
            if (!element) return true;
            // console.log(element.innerText);

            return !element.innerText || element.innerText.trim().length === 0;
        };

        // method to compare two elements position
        this.elementPositionCompareX = (id1, id2, directNode = true) => {
            let element1 = id1
            let element2 = id2;
            if (!directNode) {
                element1 = document.body.querySelector(id1);
                element2 = document.body.querySelector(id2);
            }
            if (!element1 || !element2) return true;
            const top1 = element1.getBoundingClientRect()["top"]; // y
            const left1 = element1.getBoundingClientRect()["left"]; // x
            const top2 = element2.getBoundingClientRect()["top"]; // y
            const left2 = element2.getBoundingClientRect()["left"]; // x
            // console.log("x1:", left1, "y1:", top1, "x2:", left2, "y2:", top2);
            let topDiff = Math.abs(top2 - top1) > 15;
            return topDiff || left1 > left2;
        }

        // method to compare two elements position
        this.elementPositionCompareY = (id1, id2, directNode = true) => {
            let element1 = id1
            let element2 = id2;
            if (!directNode) {
                element1 = document.body.querySelector(id1);
                element2 = document.body.querySelector(id2);
            }
            if (!element1 || !element2) return true;
            // console.log(element2.nodeName);
            const top1 = element1.getBoundingClientRect()["top"]; // y
            const left1 = element1.getBoundingClientRect()["left"]; // x
            const top2 = element2.getBoundingClientRect()["top"]; // y
            const left2 = element2.getBoundingClientRect()["left"]; // x
            // console.log("x1:", left1, "y1:", top1, "x2:", left2, "y2:", top2);
            let leftDiff = Math.abs(left2 - left1) > 45;
            return leftDiff || top1 > top2;
        };

        // check border of the element with id
        this.checkBorder = (id, order = "bottom", width = "1px", style = "solid") => {
            if (order === "bottom") {
                if (this.elementStyle(id, this.borderBotStyle, style)) return true;

                if (this.elementStyle(id, this.borderBotWidth, width)) return true;
            } else if (order === "top") {
                if (this.elementStyle(id, this.borderTopStyle, style)) return true;

                if (this.elementStyle(id, this.borderTopWidth, width)) return true;
            } else if (order === "all") {
                if (this.elementStyle(id, "border-style", style)) return true;

                if (this.elementStyle(id, "border-width", width)) return true;

            }
        };

        // method to check if element with id has right parent element
        this.elementHasParent = (id, parentId, directParentNode = false) => {
            let parent = parentId;
            if (!directParentNode) parent = document.body.querySelector(parentId);
            if (!parent) return true;
            // console.log(parent.id)
            const element = parent.querySelector(id);
            // console.log(element.className)
            return !element;
        };

        // method to check anchors
        this.checkAnchors = (id, parent) => {
            // check parent
            if (this.elementHasParent(id, parent))
                return this.wrongParentMsg(id, parent);

            // check tag
            if (this.elementExists(id, "a"))
                return this.wrongTagMsg(id, "a");

            // check text
            if (this.elementHasText(id))
                return this.wrongTextMsg(id);

            // check text-decoration
            if (this.elementStyle(id, this.textDec, "none"))
                return this.wrongStyleMsg(id, this.textDec);
        };

        this.checkOrderedAnchors = (element, parent) => {
            // text
            if (!element.innerText || element.innerText.trim().length === 0)
                return this.noTextAnchorMsg(parent);

            // text-decoration
            if (getComputedStyle(element)[this.textDec] !== "none") {
                return this.wrongTextDecorAnchorMsg(parent);
            }

        }

        this.checkCardsStyle = (id, selector) => {
            // check border
            if (this.checkBorder(id, "all"))
                return this.wrongStyleMsg(selector, "border width or style");

            // check text-align
            if (this.elementStyle(id, "text-align", "center"))
                return this.wrongStyleMsg(selector, "text-align");

            // check border-radius
            if (this.elementStyle(id, "border-radius", "10px"))
                return this.wrongStyleMsg(selector, "border-radius");
        }

        // CONSTANTS-->
        const checkFigma = "It should be close to the Figma designs.";
        const theElement = "the element with the selector of";
        const thePage = "In the page,";
        this.header = "header";
        this.main = "main";
        this.footer = "footer";
        this.nav = "nav";
        this.textDec = "text-decoration-line";
        this.borderBotStyle = "border-bottom-style";
        this.borderBotWidth = "border-bottom-width";
        this.borderTopStyle = "border-top-style";
        this.borderTopWidth = "border-top-width";
        // <--CONSTANTS

        // MESSAGES-->
        this.missingIdMsg = (id) => {
            return `${thePage} ${theElement} ${id} is missing in the body of the HTML document.`;
        };
        this.wrongTagMsg = (id, tag, tagAlt) => {
            if (tagAlt) return `${thePage} ${theElement} ${id} should be a/an ${tag} or ${tagAlt} tag.`;
            else return `${thePage} ${theElement} ${id} should be a/an ${tag} tag.`;
        };
        this.wrongStyleMsg = (id, style) => {
            return `${thePage} ${theElement} ${id}'s ${style} is different from the Figma designs or the description.`;
        };
        this.wrongParentMsg = (id, parentId) => {
            return `${thePage} ${theElement} ${id} should be a child of ${theElement} ${parentId}.`;
        };
        this.wrongTextMsg = (id) => {
            return `${thePage} ${theElement} ${id} has no text value.`;
        };
        this.noTextAnchorMsg = (id) => {
            return `${thePage} inside ${theElement} ${id}, one of the anchors don't have a text value.`;
        };
        this.wrongTextDecorAnchorMsg = (id) => {
            return `${thePage} inside ${theElement} ${id}, one of the anchors has the wrong text-decoration.`;
        };
        this.wrongPositionCompareXMsg = (id1, id2) => {
            return `${thePage} ${theElement} ${id1} should be on the left of ${theElement} ${id2}.`;
        };
        this.wrongPosAnchorsXMsg = (elementOrder1, elementOrder2, parent) => {
            return `${thePage} inside ${theElement} ${parent}, the anchor with the order of ${elementOrder1} should be on the left of the anchor with the order of ${elementOrder2}.`;
        };
        this.wrongPositionCompareYMsg = (id1, id2) => {
            return `${thePage} ${theElement} ${id1} should be above ${theElement} ${id2}.`;
        };
        this.wrongAnchorLength = (id, amount) => {
            return `${thePage} ${theElement} ${id} should have ${amount} anchor tags inside.`;
        };
        this.wrongSectionLength = (id, amount) => {
            return `${thePage} ${theElement} ${id} should have ${amount} section tags inside.`;
        };
        this.wrongNumOfElements = (id, amount, extraSelector) => {
            return `${thePage} ${theElement} ${id} should have ${amount} ${extraSelector} elements inside.`;
        };
        // <--MESSAGES
        return correct();

    }), this.page.execute(() => {
        // test #3
        // STAGE1 TAGS EXIST

        // check if header exists
        if (this.elementExists(this.header)) return wrong(this.missingIdMsg(this.header));

        // check if main exists
        if (this.elementExists(this.main)) return wrong(this.missingIdMsg(this.main));

        // check if footer exists
        if (this.elementExists(this.footer)) return wrong(this.missingIdMsg(this.footer));

        return correct();
    }),
        // test #4 removed
        this.page.execute(() => {
            // test #5
            // STAGE1 CSS PROPERTIES

            // check if header has correct border-bottom
            if (this.checkBorder(this.header))
                return wrong(this.wrongStyleMsg(this.header, "border-bottom"));

            // check if footer has correct border-top
            if (this.checkBorder(this.footer, "top"))
                return wrong(this.wrongStyleMsg(this.footer, "border-top"));

            return correct()
        }),
        this.page.execute(() => {
            // test #6
            // STAGE1 CHILDREN

            // header children

            // check if header has nav
            if (this.elementHasParent(this.nav, this.header))
                return wrong(this.wrongParentMsg(this.nav, this.header));

            // check #nav-brand
            if (this.checkAnchors("#nav-brand", this.header))
                return wrong(this.checkAnchors("#nav-brand", this.header));

            let anchors = Array.from(document.querySelectorAll(this.nav + " a"));
            let anchorNum = 4;
            if (anchors.length !== anchorNum)
                return wrong(this.wrongAnchorLength(this.nav, anchorNum));

            const temp = [];
            anchors.forEach(anchor => {
                const result = this.checkOrderedAnchors(anchor, this.nav);
                if (result)
                    temp.push(result);
            });
            if (temp.length > 0)
                return wrong(temp[0]);

            // footer children
            anchors = Array.from(document.querySelectorAll(this.footer + " a"));
            anchorNum = 5;
            if (anchors.length !== anchorNum)
                return wrong(this.wrongAnchorLength(this.footer, anchorNum));

            anchors.forEach(anchor => {
                const result = this.checkOrderedAnchors(anchor, this.footer);
                if (result)
                    temp.push(result);
            });
            if (temp.length > 0)
                return wrong(temp[0]);

            return correct()
        }),
        this.page.execute(() => {
            // test #7
            // STAGE1 CHILDREN POSITION

            // check nav anchors position
            let anchors = Array.from(document.querySelectorAll(this.nav + " a"));
            let selector = (n) => this.nav + ` a:nth-child(${n})`;
            let temp = [];
            for (let i = 0; i < anchors.length -1; i++) {
                if ( this.elementPositionCompareX(anchors[i], anchors[i + 1]))
                    temp.push(this.wrongPositionCompareXMsg(selector(i + 1), selector(i + 2)));
            }
            if (temp.length > 0) return wrong(temp[0]);

            // check footer anchors position
            anchors = Array.from(document.querySelectorAll(this.footer + " a"));
            selector = (n) => this.footer + ` a:nth-child(${n})`;
            for (let i = 0; i < anchors.length -1; i++) {
                if ( this.elementPositionCompareX(anchors[i], anchors[i + 1]))
                    temp.push(this.wrongPositionCompareXMsg(selector(i + 1), selector(i + 2)));
            }
            if (temp.length > 0) return wrong(temp[0]);

            return correct()
        }),
        this.page.execute(() => {
            // test #8
            // STAGE2 MAIN CHILDREN

            // check if sections exist
            const sections = Array.from(document.querySelectorAll(this.main + " section"));
            const sectionNum = 3;
            if (sections.length !== sectionNum)
                return wrong(this.wrongSectionLength(this.main, sectionNum));

            // check h1 in section1
            const section1 = this.main + " section:nth-child(1)";
            const h1 = section1 + " h1";
            if (this.elementExists(h1))
                return wrong(this.missingIdMsg(h1));

            // check h1 text align
            if (this.elementStyle(h1, "text-align", "center"))
                return wrong(this.wrongStyleMsg(h1, "text-align"));

            // check h1 text
            if (this.elementHasText(h1))
                return wrong(this.wrongTextMsg(h1));

            // check p in section1
            const p = section1 + " p";
            if (this.elementExists(p))
                return wrong(this.missingIdMsg(p));

            // check p text-align
            if (this.elementStyle(p, "text-align", "center"))
                return wrong(this.wrongStyleMsg(p, "text-align"));

            // check p text
            if (this.elementHasText(p))
                return wrong(this.wrongTextMsg(p));

            // check cards in section2
            const section2 = this.main + " section:nth-child(2)";
            const cards = Array.from(document.querySelectorAll(section2 + " .card"));
            const cardNum = 3;
            if (cards.length !== cardNum)
                return wrong(this.wrongNumOfElements(section2, cardNum, ".card"));

            // check cards are divs
            const temp = [];
            cards.forEach((card, index) => {
                if (card.tagName !== "DIV")
                    temp.push(this.wrongTagMsg(`main section .card:nth-child(${index + 1})`, "div"));
            });
            if (temp.length > 0) return wrong(temp[0]);

            // check cards style
            cards.forEach((card, index) => {
                let result = this.checkCardsStyle(card, `main section .card:nth-child(${index + 1})`);
                if (result)
                    temp.push(result);
            });
            if (temp.length > 0) return wrong(temp[0]);

            const selector = (n) => `${section2} .card:nth-child(${n})`;
            // check cards position
            for (let i = 0; i < cards.length -1; i++) {
                if(this.elementPositionCompareX(cards[i], cards[i + 1]))
                    temp.push(this.wrongPositionCompareXMsg(selector(i + 1), selector(i + 2)));
            }
            if (temp > 0) return wrong(temp[0]);

            // check cards have .card-header
            cards.forEach((card, index) => {
                if (this.elementHasParent(".card-header", card, true))
                    temp.push(this.wrongParentMsg(".card-header", `.card:nth-child(${index + 1})`));
            });
            if (temp.length > 0) return wrong(temp[0]);

            // check .card-header are div
            const cardHeaders = Array.from(document.querySelectorAll(section2 + " .card-header"));
            cardHeaders.forEach((cardHeader, index) => {
                if (cardHeader.tagName !== "DIV")
                    temp.push(this.wrongTagMsg(`main section .card:nth-child(${index + 1}) .card-header`, "div"));

                // check .card-header have h4
                if (this.elementHasParent("h4", cardHeader, true))
                    temp.push(this.wrongParentMsg("h4", `.card:nth-child(${index + 1}) .card-header`));

                if (this.elementHasText(`main section .card:nth-child(${index + 1}) .card-header h4`))
                    temp.push(this.wrongTextMsg(`main section .card:nth-child(${index + 1}) .card-header h4`));

                // check .card-header style
                if (this.checkBorder(cardHeader))
                    temp.push(this.wrongStyleMsg(`main section .card:nth-child(${index + 1}) .card-header`, "border-bottom width or style"));
            });
            if (temp.length > 0) return wrong(temp[0]);

            // check cards have .card-body
            cards.forEach((card, index) => {
                if (this.elementHasParent(".card-body", card, true))
                    temp.push(this.wrongParentMsg(".card-body", `.card:nth-child(${index + 1})`));
            });
            if (temp.length > 0) return wrong(temp[0]);

            const cardBodies = Array.from(document.querySelectorAll(section2 + " .card-body"));
            // check .card-body have h3
            cardBodies.forEach((cardBody, index) => {
                // check .card-body are div
                if (cardBody.tagName !== "DIV")
                    temp.push(this.wrongTagMsg(`main section .card:nth-child(${index + 1}) .card-body`, "div"));

                if (this.elementHasParent("h3", cardBody, true))
                    temp.push(this.wrongParentMsg("h3", `.card:nth-child(${index + 1}) .card-body`));

                if (this.elementHasText(`main section .card:nth-child(${index + 1}) .card-body h3`))
                    temp.push(this.wrongTextMsg(`main section .card:nth-child(${index + 1}) .card-body h3`));

                // check .card-body have 4 p
                const p = Array.from(cardBody.querySelectorAll("p"));
                if (p.length !== 4)
                    temp.push(this.wrongNumOfElements(`.card:nth-child(${index + 1}) .card-body`, 4, "p"));

                // check p text
                p.forEach((p, _index) => {
                    if (this.elementHasText(p))
                        temp.push(this.wrongTextMsg(`main section .card:nth-child(${index + 1}) .card-body p:nth-child(${_index + 1})`));
                });

                // check .card-body have button
                if (this.elementHasParent("button", cardBody, true))
                    temp.push(this.wrongParentMsg("button", `.card:nth-child(${index + 1}) .card-body`));

                // check button text
                if (this.elementHasText(`main section .card:nth-child(${index + 1}) .card-body button`))
                    temp.push(this.wrongTextMsg(`main section .card:nth-child(${index + 1}) .card-body button`));
            });
            if (temp.length > 0) return wrong(temp[0]);

            return correct()
        }),
        this.page.execute(() => {
            // test #9
            // STAGE3 SECTION3

            // check h2 in section2
            const section3 = this.main + " section:nth-child(3)";
            const h2 = section3 + " h2";
            if (this.elementExists(h2))
                return wrong(this.missingIdMsg(h2));

            // check h2 style
            if (this.elementStyle(h2, "text-align", "center"))
                return wrong(this.wrongStyleMsg(h2, "text-align"));

            // check h2 text
            if (this.elementHasText(h2))
                return wrong(this.wrongTextMsg(h2));

            // check table in section3
            const table = section3 + " table";
            if (this.elementExists(table))
                return wrong(this.missingIdMsg(table));

            // check thead in table
            const thead = table + " thead";
            if (this.elementExists(thead))
                return wrong(this.missingIdMsg(thead));

            // check tbody in table
            const tbody = table + " tbody";
            if (this.elementExists(tbody))
                return wrong(this.missingIdMsg(tbody));

            // check tr in thead
            const tr = thead + " tr";
            if (this.elementExists(tr))
                return wrong(this.missingIdMsg(tr));

            // check th in tr have at least 4
            const ths = Array.from(document.querySelectorAll(tr + " th"));
            if (ths.length < 4)
                return wrong(this.wrongNumOfElements(tr + " th", 4, "th"));

            // check ths style
            ths.forEach((th, index) => {
                if (this.checkBorder(th, "all"))
                    return wrong(this.wrongStyleMsg(tbody + ` th:nth-child(${index + 1})`, "border width or style"));
            });

            // check tr in tbody have 5
            const trs = Array.from(document.querySelectorAll(tbody + " tr"));
            if (trs.length < 4)
                return wrong(this.wrongNumOfElements(tbody + " tr", 4, "tr"));

            // check th in tbody trs
            let temp = [];
            trs.forEach((tr, index) => {
                if (this.elementExists(tbody + ` tr:nth-child(${index + 1}) th`))
                    temp.push(this.missingIdMsg(tbody + ` tr:nth-child(${index + 1}) th`));

                // check td in tbody trs have 3
                const tds = Array.from(tr.querySelectorAll("td"));
                if (tds.length < 3)
                    temp.push(this.wrongNumOfElements(tbody + ` tr:nth-child(${index + 1})`, 3, "td"));

                // check td style
                tds.forEach((td, _index) => {
                    if (this.checkBorder(td, "all"))
                        temp.push(this.wrongStyleMsg(tbody + ` tr:nth-child(${index + 1}) td:nth-child(${_index + 1})`, "border width or style"));
                });

            });
            if (temp.length > 0) return wrong(temp[0]);

            return correct();
        }),
        this.node.execute(async () => {
            // test #10
            // set viewport
            await this.page.open()
            await this.page.setViewport({width: 425, height: 768})

            await this.page.evaluate(() => {
                document.body.style.zoom = '100%';
            });

            return correct()
        }),
        this.page.execute(() => {
            // test #11
            // STAGE4 RESPONSIVE
            const mobileMsg = "For mobile screens: "

            // check anchor on top of nav
            const navBrand = document.body.querySelector("#nav-brand");
            const secondAnchor = document.querySelectorAll(this.nav + " a")[1];
            if (this.elementPositionCompareY(navBrand, secondAnchor))
                return wrong(mobileMsg + this.wrongPositionCompareYMsg("#nav-brand", this.nav));

            // check footer anchors position
            const anchors = Array.from(document.querySelectorAll(this.footer + " a"));
            let selector = (n) => this.footer + ` a:nth-child(${n})`;
            let temp = [];
            for (let i = 0; i < anchors.length -1; i++) {
                if ( this.elementPositionCompareY(anchors[i], anchors[i + 1]))
                    temp.push(this.wrongPositionCompareYMsg(selector(i + 1), selector(i + 2)));
            }
            if (temp.length > 0) return wrong(mobileMsg + temp[0]);

            // check cards position
            const cards = Array.from(document.querySelectorAll("main section .card"));
            selector = (n) => `main section .card:nth-child(${n})`;

            temp = [];
            for (let i = 0; i < cards.length -1; i++) {
                if ( this.elementPositionCompareY(cards[i], cards[i + 1]))
                    temp.push(this.wrongPositionCompareYMsg(selector(i + 1), selector(i + 2)));
            }
            if (temp.length > 0) return wrong(mobileMsg + temp[0]);

            return correct();
        }),
    ]

}

it("Test stage", async () => {
    await new Test().runTests()
}).timeout(30000);