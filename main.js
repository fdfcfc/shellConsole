define(function (require, exports, module) {
    "use strict";

    const AppInit = brackets.getModule("utils/AppInit"),
        CommandManager = brackets.getModule("command/CommandManager"),
        Menus = brackets.getModule("command/Menus"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        PanelManager = brackets.getModule("view/PanelManager"),
        NodeConnector = brackets.getModule("NodeConnector");

    const NODE_CONNECTOR_ID = "ext_main_shell";
    let nodeConnector = NodeConnector.createNodeConnector(NODE_CONNECTOR_ID, exports);

    var toolbar = require("text!html/toolbar.html");

    var panelHtml = require("text!html/panel.html");

    var shellPanel = PanelManager.createBottomPanel("shell.panel", $(panelHtml), 100);
    shellPanel.hide();

    $("#close-shell").on("click", function () {
        shellPanel.hide();
    });

    var COMMAND_ID = "shell.toggle";
    CommandManager.register("Toggle Shell", COMMAND_ID, function () {
        if (shellPanel.isVisible()) {
            shellPanel.hide();
        } else {
            shellPanel.show();
        }
    });

    var menu = Menus.getMenu(Menus.AppMenuBar.VIEW_MENU);
    menu.addMenuItem(COMMAND_ID);

    $("#main-toolbar .buttons").append(toolbar);
    $("#main-toolbar").on("click", function () {
        if (shellPanel.isVisible()) {
            shellPanel.hide();
        } else {
            shellPanel.show();
        }
    });

    AppInit.appReady(function () {
        ExtensionUtils.loadStyleSheet(module, "styles/main.css");

        let clearCmds = ["cls", "clean", "clear"];
        $("#shell-input").on("keypress", async function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                var input = await $(this).val().trim();
                $(this).val("");

                if (clearCmds.includes(input)) {
                    $("#shell-output").html("");
                } else {
                    let dir = "";
                    nodeConnector
                        .execPeer("execute", { input })
                        .then((result) => {
                            let msg = JSON.parse(result).msg;
                            dir = JSON.parse(result).dir;
                            $("#shell-output").append(`<div>${dir}&gt; ${input}</div>`);
                            $("#shell-output").append(`<div>${msg}</div>`);
                            $("#shell-output").append(`<div></div>`);
                        })
                        .catch((err) => {
                            console.log("err", err);
                            $("#shell-output").append(`<div>${dir}&gt; ${input}</div>`);
                            $("#shell-output").append(`<div style="color: red;">${err.message}</div>`);
                            $("#shell-output").append(`<div></div>`);
                        });
                }
            }
        });
    });
});
