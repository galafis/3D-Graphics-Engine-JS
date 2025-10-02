const { expect } = require("chai");
const { JSDOM } = require("jsdom");
const fs = require("fs");

describe("GitHub Pages", () => {
    let dom;
    let document;

    beforeEach(() => {
        const html = fs.readFileSync(require.resolve("../index.html"), "utf-8");
        dom = new JSDOM(html);
        document = dom.window.document;
    });

    it("should have a title", () => {
        expect(document.title).to.equal("3D Graphics Engine JS");
    });

    it("should have a canvas element", () => {
        const canvas = document.getElementById("graphicsCanvas");
        expect(canvas).to.not.be.null;
        expect(canvas.tagName).to.equal("CANVAS");
    });

    it("should link to style.css", () => {
        const link = document.querySelector("link[rel=\"stylesheet\"]");
        expect(link).to.not.be.null;
        expect(link.href).to.include("style.css");
    });

    it("should link to script.js", () => {
        const script = document.querySelector("script[src=\"script.js\"]");
        expect(script).to.not.be.null;
        expect(script.src).to.include("script.js");
    });
});

