// Ink Collection vars
var inkManager,
       start_id,
       pointerDeviceType,
       strokePathString,
       strokePathElem,
       pointerId,
       canvas;

// Reco Storage vars
var targetCont,
    strokes0,
    strokes1,
    strokes2,
    strokes3,
    isRecognizing,
    recognizeInterval,
    recoStack;

window.onload = function () {

   

    var svgns = "http://www.w3.org/2000/svg";
    var XLINKNS = 'http://www.w3.org/1999/xlink';
    var XMLNS = "http://www.w3.org/XML/1998/namespace";

    function initialize() {
        
        // Initialize necessary containers
        inkManager = new Windows.UI.Input.Inking.InkManager();
        canvas = document.getElementById("canvas");

        isRecognizing = false;

        // Reset stroke containers
        strokes0 = [];
        strokes1 = [];
        strokes2 = [];
        strokes3 = [];

        // Bind event listeners for ink collection
        canvas.addEventListener("MSPointerDown", onPointerDown, false);
        canvas.addEventListener("MSPointerMove", onPointerMove, false);
        canvas.addEventListener("MSPointerUp", onPointerUp, false);

        document.getElementById("ink_BDR_0").addEventListener("MSPointerDown", setIndexListener, false);
        document.getElementById("ink_BDR_1").addEventListener("MSPointerDown", setIndexListener, false);
        document.getElementById("ink_BDR_2").addEventListener("MSPointerDown", setIndexListener, false);
        document.getElementById("ink_BDR_3").addEventListener("MSPointerDown", setIndexListener, false);

        document.getElementById("recognizeStrokes").addEventListener("click", recognize, false);
    }

    function onPointerDown(evt) {
        pointerDeviceType = getPointerDeviceType(evt.pointerId);

        if ((pointerDeviceType === "Pen") || (pointerDeviceType === "Mouse" && evt.button === 0)) {
            var current = evt.currentPoint;

            strokePathString = "M" + current.position.x + " " + current.position.y;

            strokePathElem = document.createElementNS(svgns, "path");
            assignAttributes(strokePathElem, {
                'stroke': "#000000",
                'stroke-width': 0.5,
                'fill': "none",
                'd': strokePathString
            });

            canvas.appendChild(strokePathElem);
            inkManager.processPointerDown(current);
            pointerId = evt.pointerId;
        }

    }

    function onPointerMove(evt) {
        if (evt.pointerId === pointerId) {
            var current = evt.currentPoint;

            if ((pointerDeviceType === "Pen") || (pointerDeviceType === "Mouse")) {
                
                strokePathString += " L" + current.position.x + " " + current.position.y;
                strokePathElem.setAttributeNS(null, "d", strokePathString);

                var pts = evt.intermediatePoints;

                for (var i = pts.length - 1; i >= 0; i--) {
                    inkManager.processPointerUpdate(pts[i]);
                }

            }
        }
    }

    function onPointerUp(evt) {
        if (evt.pointerId === pointerId) {
            if ((pointerDeviceType === "Pen") || (pointerDeviceType === "Mouse")) {
                inkManager.processPointerUp(evt.currentPoint);
                
                // add last stroke to proper array
                var manager_index = inkManager.getStrokes().length - 1;

                assignStroke(manager_index, targetCont);
                targetCont = -1;
                pointerId = -1;
            }
        }
    }

    function recognize() {
        
        recoStack = [];
        recoStack.push(strokes0);
        recoStack.push(strokes1);
        recoStack.push(strokes2);
        recoStack.push(strokes3);

        recognizeInterval = setInterval(function recognizeStrokes() {
            if (isRecognizing) {
                return;
            }

            if (recoStack.length == 0) {
                stopRecognition();
                return;
            }

            isRecognizing = true;

            deselectAllManagerStrokes();

            var cur_value = recoStack.pop();
            
            if (cur_value.length > 0) {
                for (var i = 0; i < cur_value.length; i++) {
                    inkManager.getStrokes()[cur_value[i]].selected = true;
                }

                var target = Windows.UI.Input.Inking.InkRecognitionTarget.selected;

                try {
                    inkManager.recognizeAsync(target).done(
                        function recognizeSucceeded(results) {

                            var string = "";

                            // I call this here just to see if a result is returned.
                            for (var i = 0; i < results.length; i++) {
                                string += results[i].getTextCandidates()[0] + " ";
                            }

                            console.log(string);
                            // Allow recognition to be run again
                            isRecognizing = false;
                        },
                        function recognizeFailed(error) {
                            var err_str = "RECO ERROR: ";

                            if (error.message != undefined) {
                                err_str += error.message;
                            }
                            else if (error.statusText != undefined) {
                                err_str += error.statusText;
                            }

                            // Allow recognition to be run again
                            isRecognizing = false;
                        }
                    );
                }
                catch (e) {
                    console.log(e);

                    // Allow recognition to be run again
                    isRecognizing = false;
                }

            } else {
                isRecognizing = false;
            }
        }, 100);

    }

    function stopRecognition() {
        isRecognizing = false;
        clearInterval(recognizeInterval);
    }


    function setIndexListener(evt) {
        var id = evt.target.parentNode.id;
        targetCont = parseInt(id.substring(id.lastIndexOf("_") + 1, id.length));
    }

    function assignStroke(manager_index, cont_index) {
        switch (cont_index) {
            case 0:
                strokes0.push(manager_index);
                break;
            case 1:
                strokes1.push(manager_index);
                break;
            case 2:
                strokes2.push(manager_index);
                break;
            case 3:
                strokes3.push(manager_index);
                break;
            default:
                break;

        }
    }

    function getPointerDeviceType(pId) {

        var pointerDeviceType;
        var pointerPoint = Windows.UI.Input.PointerPoint.getCurrentPoint(pId);

        switch (pointerPoint.pointerDevice.pointerDeviceType) {

            case Windows.Devices.Input.PointerDeviceType.touch:
                pointerDeviceType = "Touch";
                break;

            case Windows.Devices.Input.PointerDeviceType.pen:
                pointerDeviceType = "Pen";
                break;

            case Windows.Devices.Input.PointerDeviceType.mouse:
                pointerDeviceType = "Mouse";
                break;

            default:
                pointerDeviceType = "Undefined";

        }

        return pointerDeviceType;
    }

    function assignAttributes(node, attrs) {
        var handle = null;
        for (var i in attrs) {
            var ns = (i.substr(0, 4) === "xml:" ? XMLNS :
                i.substr(0, 6) === "xlink:" ? XLINKNS : null);

            if (ns) {
                node.setAttributeNS(ns, i, attrs[i]);
            } else {
                node.setAttribute(i, attrs[i]);
            }

        }
    }

    function deselectAllManagerStrokes() {
        // Iterate through each stroke.
        inkManager.getStrokes().forEach(
            function (stroke) {
                stroke.selected = 0;
            }
        );
    }

    initialize();
}