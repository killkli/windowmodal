/**
* WindowJS is a library for displaying windows inside of a webpage.
*
* @author Matthias Thalmann (https://github.com/m-thalmann/)
* @license MIT
*/
export function Window(title, options) {
    'use strict'
    const WindowState = {
        NORMAL: 0,
        MAXIMIZED: 1,

        MINIMIZED: 2,
        SHOWN: 3,
        HIDDEN: 4
    }
    const WindowUtil = {
        getProperty: function (options, opt, def) {
            if (typeof options[opt] !== "undefined") {
                return options[opt];
            } else {
                return def;
            }
        }
    };

    let self = this;
    let container = null;
    let num = Window.count++;

    let living = true;

    let events = {};

    let display_state = WindowState.HIDDEN;
    let size_state = WindowState.NORMAL;

    // let selected = false;

    let size = {
        width: 0,
        height: 0
    };

    let position = {
        x: 0,
        y: 0
    };

    let drag_position = {
        x: 0,
        y: 0
    }

    let resize_position = {
        x: 0,
        y: 0
    }

    let current_resize = null;

    let cursor_resize = {
        "n": "ns-resize",
        "e": "ew-resize",
        "s": "ns-resize",
        "w": "ew-resize",
        "ne": "nesw-resize",
        "se": "nwse-resize",
        "sw": "nesw-resize",
        "nw": "nwse-resize"
    };

    let mousedown_bar = false;
    let mousedown_resize = false;

    this.content = null;

    if (typeof title !== "string") {
        throw new Error("Parameter 1 must be of type string");
    }

    if (typeof options !== "undefined") {
        if (typeof options !== "object") {
            throw new Error("Parameter 2 must be of type object");
        }

        size_state = WindowUtil.getProperty(options, "state", WindowState.NORMAL);

        if (size_state != WindowState.NORMAL && size_state != WindowState.MAXIMIZED) {
            throw new Error("'state' must be WindowState.NORMAL or WindowState.MAXIMIZED");
        }
    } else {
        options = {};
    }

    if (typeof options.position !== "object") {
        options.position = {};
    }

    this.getTitle = function () {
        if (!living) {
            return;
        }

        return title;
    }

    this.setTitle = function (_title) {
        if (!living) {
            return;
        }

        if (typeof _title !== "string") {
            throw new Error("Parameter 1 must be of type string");
        }

        self.on("change_title")({ old_title: title, new_title: _title });

        title = _title;

        if (container !== null) {
            container.getElementsByClassName('window_title')[0].innerHTML = title;
        }
    }

    this.getContainer = function () {
        if (!living) {
            return;
        }

        if (container == null) {
            console.warn("Container not yet created");
        }

        return container;
    }

    this.changeOption = function (option, value) {
        if (!living) {
            return;
        }

        if (typeof option === "string") {
            if (typeof value !== "undefined") {
                options[option] = value;

                if (container != null) {
                    switch (option) {
                        case 'icon': {
                            container.getElementsByClassName('window_icon')[0].innerHTML = value;
                            break;
                        }
                        case 'minimize_icon': {
                            container.getElementsByClassName('window_button_minimize')[0].innerHTML = value;
                            break;
                        }
                        case 'maximize_icon': {
                            changeSizeState(size_state);
                            break;
                        }
                        case 'normalsize_icon': {
                            changeSizeState(size_state);
                            break;
                        }
                        case 'close_icon': {
                            container.getElementsByClassName('window_button_close')[0].innerHTML = value;
                            break;
                        }
                        case 'size': {
                            updateSize();
                            break;
                        }
                        case 'position': {
                            updatePosition();
                            break;
                        }
                        case 'selected': {
                            updateSelected();
                            break;
                        }
                        case 'min_size': {
                            updateSize();
                            break;
                        }
                        case 'max_size': {
                            updateSize();
                            break;
                        }
                        case 'events': {
                            updateEvents();
                            break;
                        }
                        case 'bar_visible': {
                            updateBarVisible();
                            break;
                        }
                        case 'resizable': {
                            updateResizable();
                            break;
                        }
                        case 'movable': {
                            updateMovable();
                            break;
                        }
                        case 'maximizable': {
                            updateMaximizable();
                            break;
                        }
                        case 'minimizable': {
                            updateMinimizable();
                            break;
                        }
                        case 'always_on_top': {
                            updateAlwaysOnTop();
                            break;
                        }
                        default: {
                            this.reload();
                        }
                    }
                }
            } else {
                throw new Error("Parameter 2 must be set");
            }
        } else {
            throw new Error("Parameter 1 must be of type string");
        }
    }

    this.getOptions = function () {
        if (!living) {
            return;
        }

        return options;
    }

    this.reload = function () {
        living = true;

        if (WindowUtil.getProperty(options, "container", null) !== container) {
            if (container != null) {
                container.remove();
                container = null;
            }
        }

        if (container == null) {
            let outer = WindowUtil.getProperty(options, "container", document.body);
            container = document.createElement("div");
            container.id = "window_" + num;
            container.className = container.id + "_window";
            container.window = self;
            outer.appendChild(container);
            container.customStyle = styleModal(container.id);
        }

        updateSize();
        updatePosition();
        updateSelected();
        updateEvents();
        updateBarVisible();
        updateResizable();
        updateMovable();
        updateMaximizable();
        updateMinimizable();
        updateAlwaysOnTop();

        display_state = WindowUtil.getProperty(options, "window_state", WindowState.SHOWN);
        changeDisplayState(display_state);

        container.innerHTML = "";

        let bar = document.createElement("div");
        bar.className = "window_bar";

        let icon = document.createElement("span");
        icon.className = "window_icon";
        icon.innerHTML = WindowUtil.getProperty(options, "icon", "");

        let title_bar = document.createElement("span");
        title_bar.className = "window_title";
        title_bar.innerHTML = title;

        let toggle_win = document.createElement("div");
        toggle_win.className = "window_toggle_buttons";

        let toggle_min = document.createElement("span");
        toggle_min.className = "window_button_minimize";
        toggle_min.innerHTML = WindowUtil.getProperty(options, "minimize_icon", "_");

        let toggle_max = document.createElement("span");
        toggle_max.className = "window_button_toggle_maximize";

        let toggle_close = document.createElement("span");
        toggle_close.className = "window_button_close";
        toggle_close.innerHTML = WindowUtil.getProperty(options, "close_icon", "&#9587;");

        toggle_win.appendChild(toggle_min);
        toggle_win.appendChild(toggle_max);
        toggle_win.appendChild(toggle_close);

        bar.appendChild(icon);
        bar.appendChild(title_bar);
        bar.appendChild(toggle_win);

        container.appendChild(bar);

        let resize_handles = new Array();
        let resize_pos = ["n", "ne", "e", "se", "s", "sw", "w", "nw"];

        for (let i = 0; i < 8; i++) {
            let handle = document.createElement("div");
            handle.className = "window_resize_handle window_resize_handle_" + resize_pos[i];
            handle.setAttribute("data-resize", resize_pos[i]);
            handle.addEventListener("mousedown", resize_mouseDown);

            handle.style.cursor = cursor_resize[resize_pos[i]];

            resize_handles.push(handle);
            container.appendChild(handle);
        }

        changeSizeState(size_state);

        if (this.content == null) {
            this.content = document.createElement("div");
            this.content.className = "window_content";
        }

        container.appendChild(this.content);

        let clicks_bar = 0;

        bar.addEventListener("mousedown", function (e) {
            if (e.button != 0) {
                return;
            }

            mousedown_bar = true;

            if (WindowUtil.getProperty(options, "movable", true)) {
                let target = e.target;

                while (target != bar) {
                    if (target != toggle_min && target != toggle_max && target != toggle_close) {
                        target = target.parentElement;
                    } else {
                        return;
                    }
                }

                e.preventDefault();

                drag_position.x = e.clientX;
                drag_position.y = e.clientY;

                container.classList.add("window_moving");
                document.addEventListener("mousemove", move_mouseDrag);
                document.addEventListener("mouseup", move_mouseUp);
            }

            clicks_bar++;

            if (clicks_bar == 1) {
                setTimeout(function () {
                    if (clicks_bar == 1) {
                        self.on("move_start")(e);
                    } else {
                        self.toggleMaximize();
                    }
                    clicks_bar = 0;
                }, Window.DOUBLE_CLICK_DELAY);
            }
        });

        bar.addEventListener("mouseup", function (e) {
            if (e.button != 0) {
                return;
            }

            mousedown_bar = false;
        });

        toggle_min.addEventListener("click", function (e) {
            e.preventDefault();
            self.minimize();
        });

        toggle_max.addEventListener("click", function (e) {
            e.preventDefault();
            self.toggleMaximize();
        });

        toggle_close.addEventListener("click", function (e) {
            e.preventDefault();
            self.close();
        });

        updateEvents();

        self.on("reload")();
    }

    function resize_mouseDown(e) {
        if (!WindowUtil.getProperty(options, "resizable", true)) {
            return;
        }

        mousedown_resize = true;
        container.classList.add("window_resizing");

        current_resize = e.target.getAttribute("data-resize");
        document.body.style.cursor = cursor_resize[current_resize];

        resize_position.x = e.clientX;
        resize_position.y = e.clientY;

        container.classList.add("window_no_animation");

        document.addEventListener("mouseup", resize_mouseUp);
        document.addEventListener("mousemove", resize_mouseDrag);

        document.body.classList.add("text_not_selectable");

        self.on("resize_start")(e);
    }

    function resize_mouseUp(e) {
        if (e) {
            e.preventDefault();
        }

        if (options.position.y <= 0) {
            self.maximize();
        }

        document.body.style.cursor = "";
        container.classList.remove("window_no_animation");
        container.classList.remove("window_resizing");

        mousedown_resize = false;
        document.removeEventListener("mouseup", resize_mouseUp);
        document.removeEventListener("mousemove", resize_mouseDrag);
        document.body.classList.remove("text_not_selectable");

        self.on("resize_stop")(e);
    }

    function resize_mouseDrag(e) {
        e.preventDefault();

        if (mousedown_resize == false) {
            resize_mouseUp();
            return;
        }

        let delta_x = 0;
        let delta_y = 0;

        let min_size = WindowUtil.getProperty(options, "min_size", { width: 200, height: 150 });
        let max_size = WindowUtil.getProperty(options, "max_size", "");

        if (current_resize == "nw" || current_resize == "n" || current_resize == "ne") {
            if (size.height > min_size.height || e.clientY < options.position.y) {
                delta_y = -(resize_position.y - e.clientY);

                if (min_size.height <= size.height - delta_y && (max_size == "" || max_size.height >= size.height - delta_y)) {
                    options.position.y += delta_y;
                }
            }
        }

        if (current_resize == "ne" || current_resize == "e" || current_resize == "se") {
            if (size.width > min_size.width || e.clientX > options.position.x + size.width) {
                delta_x = resize_position.x - e.clientX;
            }
        }

        if (current_resize == "sw" || current_resize == "s" || current_resize == "se") {
            if (size.height > min_size.height || e.clientY > options.position.y + size.height) {
                delta_y = resize_position.y - e.clientY;
            }
        }

        if (current_resize == "nw" || current_resize == "w" || current_resize == "sw") {
            if (size.width > min_size.width || e.clientX < options.position.x) {
                delta_x = -(resize_position.x - e.clientX);

                if (min_size.width <= size.width - delta_x && (max_size == "" || max_size.width >= size.width - delta_x)) {
                    options.position.x += delta_x;
                }
            }
        }

        if (current_resize == "nw" || current_resize == "n" || current_resize == "ne" || current_resize == "w" || current_resize == "sw") {
            updatePosition();
        }

        resize_position.x = e.clientX;
        resize_position.y = e.clientY;

        self.changeOption("size", {
            width: (size.width - delta_x),
            height: (size.height - delta_y)
        });

        updateSize();

        self.on("resize")(e);
    }

    function move_mouseDrag(e) {
        if (mousedown_resize) {
            return;
        }

        if (!self.isNormalSized()) {
            container.classList.add('window_no_animation');

            self.normalSize();

            let _bar = container.getElementsByClassName('window_bar')[0];

            self.changeOption("position", {
                x: e.clientX - (_bar.offsetWidth / 2),
                y: e.clientY - (_bar.offsetHeight / 2)
            });

            container.classList.remove('window_no_animation');
        }

        e.preventDefault();

        if (mousedown_bar == false) {
            move_mouseUp();
            return;
        }

        let delta_x = drag_position.x - e.clientX;
        let delta_y = drag_position.y - e.clientY;

        drag_position.x = e.clientX;
        drag_position.y = e.clientY;

        self.changeOption("position", {
            x: (container.offsetLeft - delta_x),
            y: (container.offsetTop - delta_y)
        });

        updatePosition();

        self.on("move")(e);
    }

    function move_mouseUp(e) {
        //Stop drag
        if (e) {
            e.preventDefault();
        }

        container.classList.remove("window_moving");

        if (options.position.y <= 0) {
            self.maximize();
        }

        document.removeEventListener("mousemove", move_mouseDrag);
        document.removeEventListener("mouseup", move_mouseUp);

        self.on("move_stop")(e);
    }

    this.changeState = function (_state) {
        if (!living) {
            return;
        }

        if (_state != WindowState.NORMAL && _state != WindowState.MAXIMIZED) {
            throw new Error("Parameter 1 must be WindowState.NORMAL or WindowState.MAXIMIZED");
        }

        self.on("change_state")({ old_state: size_state, new_state: _state });

        size_state = _state;

        changeSizeState(_state);
    }

    this.changeWindowState = function (_window_state) {
        if (!living) {
            return;
        }

        if (_window_state != WindowState.MINIMIZED && _window_state != WindowState.HIDDEN && _window_state != WindowState.SHOWN) {
            throw new Error("Parameter 1 must be WindowState.HIDDEN or WindowState.MINIMIZED or WindowState.SHOWN");
        }

        self.on("change_window_state")({ old_window_state: display_state, new_window_state: _window_state });

        display_state = _window_state;

        changeDisplayState(display_state);
    }

    function changeSizeState(_size_state) {
        container.classList.remove("window_maximized");
        let toggle_max = container.getElementsByClassName('window_button_toggle_maximize')[0];

        switch (_size_state) {
            case WindowState.MAXIMIZED: {
                container.classList.add("window_maximized");
                toggle_max.innerHTML = WindowUtil.getProperty(options, "normalsize_icon", "&#10697;");
                break;
            }
            case WindowState.NORMAL: {
                toggle_max.innerHTML = WindowUtil.getProperty(options, "maximize_icon", "&#9744;");
                break;
            }
            default: {
                toggle_max.innerHTML = WindowUtil.getProperty(options, "maximize_icon", "&#9744;");
                console.warn("This state is not allowed (" + _size_state + "); skipping");
            }
        }

    }

    function changeDisplayState(_display_state) {
        container.classList.remove("window_hidden");
        container.classList.remove("window_minimized");

        switch (_display_state) {
            case WindowState.HIDDEN: {
                container.classList.add("window_hidden");
                break;
            }
            case WindowState.MINIMIZED: {
                container.classList.add("window_minimized");
                break;
            }
            case WindowState.SHOWN: {
                break;
            }
            default: {
                console.warn("This window-state is not allowed (" + _display_state + "); skipping");
            }
        }
    }

    function updateSize() {
        if (!living) {
            return;
        }

        let _size = WindowUtil.getProperty(options, "size", "");

        if (_size == "") {
            options.size = { width: 200, height: 150 };
            _size = options.size;
        }

        let old_size = {
            width: options.size.width,
            height: options.size.height
        };

        size.width = WindowUtil.getProperty(_size, "width", 200);
        size.height = WindowUtil.getProperty(_size, "height", 150);

        let _min_size = WindowUtil.getProperty(options, "min_size", { width: 200, height: 150 });
        let _max_size = WindowUtil.getProperty(options, "max_size", "");

        if (_min_size != "") {
            let _min_width = WindowUtil.getProperty(_min_size, "width", "");
            let _min_height = WindowUtil.getProperty(_min_size, "height", "");

            if (_min_width != "") {
                if (size.width < _min_width) {
                    size.width = _min_width;
                    options.size.width = size.width;
                }
            }

            if (_min_height != "") {
                if (size.height < _min_height) {
                    size.height = _min_height;
                    options.size.height = size.height;
                }
            }
        }

        if (_max_size != "") {
            let _max_width = WindowUtil.getProperty(_max_size, "width", "");
            let _max_height = WindowUtil.getProperty(_max_size, "height", "");

            if (_max_width != "") {
                if (size.width > _max_width) {
                    size.width = _max_width;
                    options.size.width = size.width;
                }
            }

            if (_max_height != "") {
                if (size.height > _max_height) {
                    size.height = _max_height;
                    options.size.height = size.height;
                }
            }
        }

        let parent = container.parentElement;

        if (size.height > parent.offsetHeight) {
            size.height = parent.offsetHeight;
            options.size.height = size.height;
            options.position.y = 0;
        }

        if (size.width > parent.offsetWidth) {
            size.width = parent.offsetWidth;
            options.size.width = size.width;
            options.position.x = 0;
        }

        container.style.width = size.width + "px";
        container.style.height = size.height + "px";

        updatePosition();

        self.on("update_size")({ old_size: old_size, new_size: size });
    }

    function updateSelected() {
        if (!living) {
            return;
        }

        self.on("update_selected")();

        let _selected = WindowUtil.getProperty(options, "selected", false);

        if (_selected) {
            container.classList.add("window_selected");
            self.on("select")();
        } else {
            container.classList.remove("window_selected");
            self.on("deselect")();
        }
    }

    this.minimize = function () {
        if (!living || !WindowUtil.getProperty(options, "minimizable", true) || self.on("minimizing") === false) {
            return;
        }

        this.changeWindowState(WindowState.MINIMIZED);

        self.on("minimize")();
    }

    this.normalSize = function () {
        if (!living) {
            return;
        }

        this.changeState(WindowState.NORMAL);

        self.on("normalSize")();
    }

    this.maximize = function () {
        if (!living || !WindowUtil.getProperty(options, "maximizable", true) || self.on("maximizing") === false) {
            return;
        }

        this.changeState(WindowState.MAXIMIZED);
        updateSize();

        self.on("maximize")();
    }

    this.toggleMaximize = function () {
        if (!living) {
            return;
        }

        if (size_state == WindowState.NORMAL) {
            self.maximize();
        } else {
            self.normalSize();
        }
    }

    this.hide = function () {
        if (!living) {
            return;
        }

        this.changeWindowState(WindowState.HIDDEN);

        self.on("hide")();
    }

    this.show = function () {
        if (!living) {
            return;
        }

        this.changeWindowState(WindowState.SHOWN);

        self.on("show")();
    }

    function updatePosition() {
        if (!living) {
            return;
        }

        let parent = container.parentElement;

        if (typeof options.position.x !== "number") {
            options.position.x = (parent.offsetWidth / 2 - container.offsetWidth / 2);
        }
        if (typeof options.position.y !== "number") {
            options.position.y = (parent.offsetHeight / 2 - container.offsetHeight / 2);
        }

        let _position = options.position;

        let old_position = {
            x: options.position.x,
            y: options.position.y
        }

        position.x = WindowUtil.getProperty(_position, "x", 0);
        position.y = WindowUtil.getProperty(_position, "y", 0);

        if (position.x < 0) {
            position.x = 0;
        }

        if (position.y < 0) {
            position.y = 0;
        }

        if (position.x > parent.offsetWidth - container.offsetWidth) {
            position.x = parent.offsetWidth - container.offsetWidth;
            options.position.x = position.x;
        }

        if (position.y > parent.offsetHeight - container.offsetHeight) {
            position.y = parent.offsetHeight - container.offsetHeight;
            options.position.y = position.y;
        }

        container.style.left = position.x + "px";
        container.style.top = position.y + "px";

        self.on("update_position")({ old_position: old_position, new_position: position });
    }

    function updateEvents() {
        let ev = WindowUtil.getProperty(options, "events", {});

        let keys = Object.keys(ev);

        for (let i = 0; i < keys.length; i++) {
            events[keys[i]] = ev[keys[i]];
        }
    }

    this.on = function (ev, callback) {
        if (!living) {
            return;
        }

        if (typeof callback === "undefined") {
            if (typeof events[ev] === "function") {
                return events[ev];
            } else {
                return function () { };
            }
        }

        events[ev] = callback;
    }

    this.removeOn = function (ev) {
        if (!living) {
            return;
        }

        delete events[ev];
    }

    function updateBarVisible() {
        if (!living) {
            return;
        }

        if (WindowUtil.getProperty(options, "bar_visible", true)) {
            container.classList.remove("window_bar_hidden");
        } else {
            container.classList.add("window_bar_hidden");
        }
    }

    function updateResizable() {
        if (WindowUtil.getProperty(options, "resizable", true)) {
            container.classList.remove("window_not_resizable");
        } else {
            container.classList.add("window_not_resizable");
        }
    }

    function updateMovable() {
        if (WindowUtil.getProperty(options, "movable", true)) {
            container.classList.remove("window_not_movable");
        } else {
            container.classList.add("window_not_movable");
        }
    }

    function updateMaximizable() {
        if (WindowUtil.getProperty(options, "maximizable", true)) {
            container.classList.remove("window_not_maximizable");
        } else {
            container.classList.add("window_not_maximizable");
        }
    }

    function updateMinimizable() {
        if (WindowUtil.getProperty(options, "minimizable", true)) {
            container.classList.remove("window_not_minimizable");
        } else {
            container.classList.add("window_not_minimizable");
        }
    }

    function updateAlwaysOnTop() {
        if (WindowUtil.getProperty(options, "always_on_top", false)) {
            container.classList.add("window_alway_on_top");
        } else {
            container.classList.remove("window_alway_on_top");
        }
    }

    this.getState = function () {
        if (!living) {
            return;
        }

        return size_state;
    }

    this.getWindowState = function () {
        if (!living) {
            return;
        }

        return display_state;
    }

    this.getSize = function () {
        if (!living) {
            return;
        }

        return size;
    }

    this.getPosition = function () {
        if (!living) {
            return;
        }

        return position;
    }

    this.isMinimized = function () {
        if (!living) {
            return;
        }

        return display_state == WindowState.MINIMIZED;
    }

    this.isHidden = function () {
        if (!living) {
            return;
        }

        return display_state == WindowState.HIDDEN;
    }

    this.isShown = function () {
        if (!living) {
            return;
        }

        return display_state == WindowState.SHOWN;
    }

    this.isVisible = function () {
        if (!living) {
            return;
        }

        return !(this.isMinimized() || this.isHidden());
    }

    this.isMaximized = function () {
        if (!living) {
            return;
        }

        return size_state == WindowState.MAXIMIZED;
    }

    this.isNormalSized = function () {
        if (!living) {
            return;
        }

        return size_state == WindowState.NORMAL;
    }

    this.isSelected = function () {
        if (!living) {
            return;
        }

        return WindowUtil.getProperty(options, "selected", false);
    }

    this.reset = function () {
        if (!living) {
            return;
        }

        this.show();
        this.normalSize();

        self.on("reset")();
    }

    this.close = function () {
        let close_option = WindowUtil.getProperty(options, "close_action", Window.DISPOSE_ON_CLOSE);
        if (!living || close_option == Window.DO_NOTHING_ON_CLOSE) {
            return;
        }

        if (self.on("closing")() !== false) {
            this.hide();

            self.on("closed")();

            if (close_option == Window.DISPOSE_ON_CLOSE) {
                this.dispose();
            }
        }
    }

    this.dispose = function () {
        if (self.on("disposing")() !== false) {
            document.head.removeChild(container.customStyle); container.customStyle = null;
            this.content.remove(); this.content = null;
            container.remove(); container = null;
            self.on("disposed")();
            living = false;
        }
    }

    this.reload();

    self.on("init")();

    function styleModal(uniqueID) {
        // Define a new stylesheet
        const [style, sheet] = (function () {
            // Create the <style> tag
            const style = document.createElement("style");

            // Add a media (and/or media query) here if you'd like!
            // style.setAttribute("media", "screen")
            // style.setAttribute("media", "only screen and (max-width : 1024px)")

            // WebKit hack :(
            style.appendChild(document.createTextNode(""));

            // Add the <style> element to the page
            document.head.appendChild(style);

            return [style, style.sheet];
        })();

        // Define css rules here
        const rules = [
            `.${uniqueID}_window{
  border: 1px solid #ccc;
  position: absolute;
  z-index: 200;
  border-radius: 2px;
  box-sizing: border-box;

  transform: scale(1);
}`,
            `.${uniqueID}_window:not(.window_no_animation):not(.window_moving){
  transition: transform 0.2s, width 0.1s, height 0.1s, left 0.02s, right 0.02s;
}`,

            `.${uniqueID}_window *{
  position: relative;
  box-sizing: border-box;
}`,
            `.${uniqueID}_window.window_alway_on_top{
  z-index: 210;
}`,
            `.${uniqueID}_window.window_alway_on_top.window_selected{
  z-index: 211;
}`,
            `.${uniqueID}_window .window_bar{
  border-bottom: 1px solid #ccc;
  background-color: #eee;
  height: 2em;
}`,
            `.${uniqueID}_window .window_bar, .text_not_selectable{
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
}`,
            `.${uniqueID}_window .window_bar > *{
  display: inline-block;
}`,
            `.${uniqueID}_window .window_bar *{
  transition: all 0.2s;
}`,
            `.${uniqueID}_window .window_bar .window_icon{
  margin: 0 10px;
  text-align: center;
  vertical-align: middle;
  cursor: pointer;
}`,
            `.${uniqueID}_window .window_bar .window_title{
  cursor: default;
  padding: 5px;
  overflow: hidden;
  max-width: calc(100% - 150px);
  vertical-align: middle;
}`,
            `.${uniqueID}_window .window_bar .window_toggle_buttons{
  position: absolute;
  top: 0;
  bottom: 0;
  right: 0;
  vertical-align: top;
  margin-left: 10px;
  z-index: 202;
}`,
            `.${uniqueID}_window .window_bar .window_toggle_buttons:after{
  clear: both;
}`,
            `.${uniqueID}_window .window_bar .window_toggle_buttons > *{
  padding-top: 2px;
  padding-bottom: 5px;
  width: 2em;
  text-align: center;
  cursor: pointer;
  height: 100%;
  overflow: hidden;
  display: inline-block;
}`,

            `.${uniqueID}_window .window_bar .window_toggle_buttons > *:hover{
  background-color: #ccc;
}`,
            `.${uniqueID}_window.window_not_maximizable .window_button_toggle_maximize, .${uniqueID}_window.window_not_minimizable .window_button_minimize{
  display: none;
}`,
            `.${uniqueID}_window .window_bar .window_toggle_buttons .window_button_close:hover{
  background-color: #ccc;
}`,
            `.${uniqueID}_window .window_content{
  overflow: auto;
  background-color: #fff;
  position: absolute;
  top: 2em;
  right: 0;
  left: 0;
  bottom: 0;
}`,
            `.${uniqueID}_window.window_maximized:not(.window_minimized){
  top: 0 !important;
  left: 0 !important;
  right: 0 !important;
  bottom: 0 !important;

  width: 100% !important;
  height: 100% !important;
}`,
            `.${uniqueID}_window.window_minimized{
  transform: scale(0);
}`,
            `.${uniqueID}_window.window_hidden{
  display: none;
}`,
            `.${uniqueID}_window.window_selected{
  -webkit-box-shadow: 0px 0px 17px -4px rgba(0,0,0,0.73);
  -moz-box-shadow: 0px 0px 17px -4px rgba(0,0,0,0.73);
  box-shadow: 0px 0px 17px -4px rgba(0,0,0,0.73);
  z-index: 202;
}`,
            `.${uniqueID}_window.window_selected .window_bar{
  background-color: #ddd;
}`,
            `.${uniqueID}_window.window_selected .window_bar .window_toggle_buttons .window_button_close:hover{
  background-color: #f12;
  color: #fff;
}`,
            `.${uniqueID}_window.window_maximized .window_resize_handle, .${uniqueID}_window.window_not_resizable .window_resize_handle, .${uniqueID}_window.window_resizing .window_resize_handle{
  display: none;
}`,
            `.${uniqueID}_window .window_resize_handle{
  position: absolute;
  display: block;
  opacity: 0;
}`,
            `.${uniqueID}_window .window_resize_handle_n, .window_resize_handle_s{
  height: 3px;
  left: 0;
  right: 0;
}`,
            `.${uniqueID}_window .window_resize_handle_w, .${uniqueID}_window .window_resize_handle_e{
  width: 3px;
  top: 0;
  bottom: 0;
}`,
            `.${uniqueID}_window .window_resize_handle_n, .${uniqueID}_window .window_resize_handle_ne, .${uniqueID}_window .window_resize_handle_nw{
  top: -3px;
}`,
            `.${uniqueID}_window .window_resize_handle_s, .${uniqueID}_window .window_resize_handle_se, .${uniqueID}_window .window_resize_handle_sw{
  bottom: -3px;
}`,
            `.${uniqueID}_window .window_resize_handle_w, .${uniqueID}_window .window_resize_handle_sw, .${uniqueID}_window .window_resize_handle_nw{
  left: -3px;
}`,
            `.${uniqueID}_window .window_resize_handle_e, .${uniqueID}_window .window_resize_handle_ne, .${uniqueID}_window .window_resize_handle_se{
  right: -3px;
}`,
            `.${uniqueID}_window .window_resize_handle_ne, .${uniqueID}_window .window_resize_handle_se, .${uniqueID}_window .window_resize_handle_sw, .${uniqueID}_window .window_resize_handle_nw{
  width: 3px;
  height: 3px;
}`,
            `.${uniqueID}_window.window_bar_hidden .window_bar{
  display: none;
}`,
            `.${uniqueID}_window.window_bar_hidden .window_content{
  top: 0;
}`,
        ];
        // Add rules to new stylesheet
        for (let i = 0; i < rules.length; i++) {
            sheet.insertRule(rules[i], sheet.cssRules.length);
        }
        return style;
    }
}

Window.count = 0;

Window.DISPOSE_ON_CLOSE = 0;
Window.HIDE_ON_CLOSE = 1;
Window.DO_NOTHING_ON_CLOSE = 2;

Window.DOUBLE_CLICK_DELAY = 300; //ms