
(function(l, i, v, e) { v = l.createElement(i); v.async = 1; v.src = '//' + (location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; e = l.getElementsByTagName(i)[0]; e.parentNode.insertBefore(v, e)})(document, 'script');
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function create_slot(definition, ctx, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.ctx, definition[1](fn ? fn(ctx) : {})))
            : ctx.$$scope.ctx;
    }
    function get_slot_changes(definition, ctx, changed, fn) {
        return definition[1]
            ? assign({}, assign(ctx.$$scope.changed || {}, definition[1](fn ? fn(changed) : {})))
            : ctx.$$scope.changed || {};
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function flush() {
        const seen_callbacks = new Set();
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    callback();
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
    }
    function update($$) {
        if ($$.fragment) {
            $$.update($$.dirty);
            run_all($$.before_update);
            $$.fragment.p($$.dirty, $$.ctx);
            $$.dirty = null;
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        if (component.$$.fragment) {
            run_all(component.$$.on_destroy);
            component.$$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            component.$$.on_destroy = component.$$.fragment = null;
            component.$$.ctx = {};
        }
    }
    function make_dirty(component, key) {
        if (!component.$$.dirty) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty = blank_object();
        }
        component.$$.dirty[key] = true;
    }
    function init(component, options, instance, create_fragment, not_equal, prop_names) {
        const parent_component = current_component;
        set_current_component(component);
        const props = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props: prop_names,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty: null
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, props, (key, value) => {
                if ($$.ctx && not_equal($$.ctx[key], $$.ctx[key] = value)) {
                    if ($$.bound[key])
                        $$.bound[key](value);
                    if (ready)
                        make_dirty(component, key);
                }
            })
            : props;
        $$.update();
        ready = true;
        run_all($$.before_update);
        $$.fragment = create_fragment($$.ctx);
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src\Swipe.svelte generated by Svelte v3.9.1 */

    const file = "src\\Swipe.svelte";

    const get_play_slot_changes = () => ({});
    const get_play_slot_context = () => ({});

    const get_pause_slot_changes = () => ({});
    const get_pause_slot_context = () => ({});

    const get_next_slot_changes = () => ({});
    const get_next_slot_context = () => ({});

    const get_previous_slot_changes = () => ({});
    const get_previous_slot_context = () => ({});

    function get_each_context(ctx, list, i) {
    	const child_ctx = Object.create(ctx);
    	child_ctx.x = list[i];
    	child_ctx.i = i;
    	return child_ctx;
    }

    // (283:2) {#if showIndicators}
    function create_if_block_2(ctx) {
    	var div;

    	var each_value = ctx.indicators;

    	var each_blocks = [];

    	for (var i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	return {
    		c: function create() {
    			div = element("div");

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}
    			attr(div, "class", "swipe-indicator swipe-indicator-inside svelte-occnps");
    			add_location(div, file, 283, 5, 6231);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			for (var i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},

    		p: function update_1(changed, ctx) {
    			if (changed.activeIndicator || changed.indicators) {
    				each_value = ctx.indicators;

    				for (var i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(changed, child_ctx);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}
    				each_blocks.length = each_value.length;
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			destroy_each(each_blocks, detaching);
    		}
    	};
    }

    // (285:8) {#each indicators as x, i }
    function create_each_block(ctx) {
    	var span, span_class_value, dispose;

    	function click_handler() {
    		return ctx.click_handler(ctx);
    	}

    	return {
    		c: function create() {
    			span = element("span");
    			attr(span, "class", span_class_value = "dot " + (ctx.activeIndicator == ctx.i ? 'is-active' : '') + " svelte-occnps");
    			add_location(span, file, 285, 10, 6332);
    			dispose = listen(span, "click", click_handler);
    		},

    		m: function mount(target, anchor) {
    			insert(target, span, anchor);
    		},

    		p: function update_1(changed, new_ctx) {
    			ctx = new_ctx;
    			if ((changed.activeIndicator) && span_class_value !== (span_class_value = "dot " + (ctx.activeIndicator == ctx.i ? 'is-active' : '') + " svelte-occnps")) {
    				attr(span, "class", span_class_value);
    			}
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(span);
    			}

    			dispose();
    		}
    	};
    }

    // (291:2) {#if showControls}
    function create_if_block(ctx) {
    	var a0, t0, t1, a1, t2, t3, current_block_type_index, if_block, if_block_anchor, current, dispose;

    	const previous_slot_template = ctx.$$slots.previous;
    	const previous_slot = create_slot(previous_slot_template, ctx, get_previous_slot_context);

    	const next_slot_template = ctx.$$slots.next;
    	const next_slot = create_slot(next_slot_template, ctx, get_next_slot_context);

    	var if_block_creators = [
    		create_if_block_1,
    		create_else_block
    	];

    	var if_blocks = [];

    	function select_block_type(changed, ctx) {
    		if (ctx.autoplay) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(null, ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	return {
    		c: function create() {
    			a0 = element("a");

    			if (!previous_slot) {
    				t0 = text("«");
    			}

    			if (previous_slot) previous_slot.c();
    			t1 = space();
    			a1 = element("a");

    			if (!next_slot) {
    				t2 = text("»");
    			}

    			if (next_slot) next_slot.c();
    			t3 = space();
    			if_block.c();
    			if_block_anchor = empty();

    			attr(a0, "href", "javascript:");
    			attr(a0, "class", "control left svelte-occnps");
    			add_location(a0, file, 291, 4, 6500);

    			attr(a1, "href", "javascript:");
    			attr(a1, "class", "control right svelte-occnps");
    			add_location(a1, file, 292, 4, 6609);

    			dispose = [
    				listen(a0, "click", ctx.previous),
    				listen(a1, "click", ctx.next)
    			];
    		},

    		l: function claim(nodes) {
    			if (previous_slot) previous_slot.l(a0_nodes);

    			if (next_slot) next_slot.l(a1_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a0, anchor);

    			if (!previous_slot) {
    				append(a0, t0);
    			}

    			else {
    				previous_slot.m(a0, null);
    			}

    			insert(target, t1, anchor);
    			insert(target, a1, anchor);

    			if (!next_slot) {
    				append(a1, t2);
    			}

    			else {
    				next_slot.m(a1, null);
    			}

    			insert(target, t3, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert(target, if_block_anchor, anchor);
    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			if (previous_slot && previous_slot.p && changed.$$scope) {
    				previous_slot.p(
    					get_slot_changes(previous_slot_template, ctx, changed, get_previous_slot_changes),
    					get_slot_context(previous_slot_template, ctx, get_previous_slot_context)
    				);
    			}

    			if (next_slot && next_slot.p && changed.$$scope) {
    				next_slot.p(
    					get_slot_changes(next_slot_template, ctx, changed, get_next_slot_changes),
    					get_slot_context(next_slot_template, ctx, get_next_slot_context)
    				);
    			}

    			var previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(changed, ctx);
    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(changed, ctx);
    			} else {
    				group_outros();
    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});
    				check_outros();

    				if_block = if_blocks[current_block_type_index];
    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}
    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(previous_slot, local);
    			transition_in(next_slot, local);
    			transition_in(if_block);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(previous_slot, local);
    			transition_out(next_slot, local);
    			transition_out(if_block);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a0);
    			}

    			if (previous_slot) previous_slot.d(detaching);

    			if (detaching) {
    				detach(t1);
    				detach(a1);
    			}

    			if (next_slot) next_slot.d(detaching);

    			if (detaching) {
    				detach(t3);
    			}

    			if_blocks[current_block_type_index].d(detaching);

    			if (detaching) {
    				detach(if_block_anchor);
    			}

    			run_all(dispose);
    		}
    	};
    }

    // (296:4) {:else}
    function create_else_block(ctx) {
    	var a, t, current, dispose;

    	const play_slot_template = ctx.$$slots.play;
    	const play_slot = create_slot(play_slot_template, ctx, get_play_slot_context);

    	return {
    		c: function create() {
    			a = element("a");

    			if (!play_slot) {
    				t = text(">");
    			}

    			if (play_slot) play_slot.c();

    			attr(a, "href", "javascript:");
    			attr(a, "class", "control play svelte-occnps");
    			add_location(a, file, 296, 6, 6862);
    			dispose = listen(a, "click", ctx.click_handler_2);
    		},

    		l: function claim(nodes) {
    			if (play_slot) play_slot.l(a_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);

    			if (!play_slot) {
    				append(a, t);
    			}

    			else {
    				play_slot.m(a, null);
    			}

    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			if (play_slot && play_slot.p && changed.$$scope) {
    				play_slot.p(
    					get_slot_changes(play_slot_template, ctx, changed, get_play_slot_changes),
    					get_slot_context(play_slot_template, ctx, get_play_slot_context)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(play_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(play_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (play_slot) play_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    // (294:4) {#if autoplay}
    function create_if_block_1(ctx) {
    	var a, t, current, dispose;

    	const pause_slot_template = ctx.$$slots.pause;
    	const pause_slot = create_slot(pause_slot_template, ctx, get_pause_slot_context);

    	return {
    		c: function create() {
    			a = element("a");

    			if (!pause_slot) {
    				t = text("||");
    			}

    			if (pause_slot) pause_slot.c();

    			attr(a, "href", "javascript:");
    			attr(a, "class", "control pause svelte-occnps");
    			add_location(a, file, 294, 6, 6733);
    			dispose = listen(a, "click", ctx.click_handler_1);
    		},

    		l: function claim(nodes) {
    			if (pause_slot) pause_slot.l(a_nodes);
    		},

    		m: function mount(target, anchor) {
    			insert(target, a, anchor);

    			if (!pause_slot) {
    				append(a, t);
    			}

    			else {
    				pause_slot.m(a, null);
    			}

    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			if (pause_slot && pause_slot.p && changed.$$scope) {
    				pause_slot.p(
    					get_slot_changes(pause_slot_template, ctx, changed, get_pause_slot_changes),
    					get_slot_context(pause_slot_template, ctx, get_pause_slot_context)
    				);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(pause_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(pause_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(a);
    			}

    			if (pause_slot) pause_slot.d(detaching);
    			dispose();
    		}
    	};
    }

    function create_fragment(ctx) {
    	var div4, div2, div1, div0, t0, div3, t1, t2, current, dispose;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	var if_block0 = (ctx.showIndicators) && create_if_block_2(ctx);

    	var if_block1 = (ctx.showControls) && create_if_block(ctx);

    	return {
    		c: function create() {
    			div4 = element("div");
    			div2 = element("div");
    			div1 = element("div");
    			div0 = element("div");

    			if (default_slot) default_slot.c();
    			t0 = space();
    			div3 = element("div");
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			if (if_block1) if_block1.c();

    			attr(div0, "class", "swipeable-slot-wrapper svelte-occnps");
    			toggle_class(div0, "touching", ctx.touching);
    			toggle_class(div0, "touched", ctx.touched);
    			add_location(div0, file, 275, 6, 5875);
    			attr(div1, "class", "swipeable-items svelte-occnps");
    			add_location(div1, file, 274, 4, 5838);
    			attr(div2, "class", "swipe-item-wrapper svelte-occnps");
    			add_location(div2, file, 273, 2, 5775);
    			attr(div3, "class", "swipe-handler svelte-occnps");
    			add_location(div3, file, 281, 2, 6091);
    			attr(div4, "class", "swipe-panel svelte-occnps");
    			add_location(div4, file, 272, 0, 5746);

    			dispose = [
    				listen(div0, "transitionend", ctx.transitionend_handler),
    				listen(div3, "touchstart", ctx.moveStart),
    				listen(div3, "mousedown", ctx.moveStart)
    			];
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div0_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div2);
    			append(div2, div1);
    			append(div1, div0);

    			if (default_slot) {
    				default_slot.m(div0, null);
    			}

    			ctx.div0_binding(div0);
    			ctx.div2_binding(div2);
    			append(div4, t0);
    			append(div4, div3);
    			ctx.div3_binding(div3);
    			append(div4, t1);
    			if (if_block0) if_block0.m(div4, null);
    			append(div4, t2);
    			if (if_block1) if_block1.m(div4, null);
    			current = true;
    		},

    		p: function update_1(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if (changed.touching) {
    				toggle_class(div0, "touching", ctx.touching);
    			}

    			if (changed.touched) {
    				toggle_class(div0, "touched", ctx.touched);
    			}

    			if (ctx.showIndicators) {
    				if (if_block0) {
    					if_block0.p(changed, ctx);
    				} else {
    					if_block0 = create_if_block_2(ctx);
    					if_block0.c();
    					if_block0.m(div4, t2);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (ctx.showControls) {
    				if (if_block1) {
    					if_block1.p(changed, ctx);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(div4, null);
    				}
    			} else if (if_block1) {
    				group_outros();
    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});
    				check_outros();
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			transition_in(if_block1);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			transition_out(if_block1);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div4);
    			}

    			if (default_slot) default_slot.d(detaching);
    			ctx.div0_binding(null);
    			ctx.div2_binding(null);
    			ctx.div3_binding(null);
    			if (if_block0) if_block0.d();
    			if (if_block1) if_block1.d();
    			run_all(dispose);
    		}
    	};
    }

    let topClearence = 0;

    let min = 0;

    function instance($$self, $$props, $$invalidate) {

      let { transitionDuration = 200, showIndicators = false, autoplay = false, delay = 1000, defaultIndex = 0, loop = false, showControls = false, activeIndicator = 0 } = $$props;
      let indicators;
      let items = 0;
      let availableWidth = 0;

      let elems;
      let diff = 0;

      let swipeWrapper;
      let swipeHandler;
      let slotWrapper;
      let touching = false;
      let touched = false;
      let posX = 0;
      let dir = 0;
      let x;



      let played = defaultIndex || 0;
      let run_interval = false;


      function update(){
        swipeHandler.style.top = topClearence + 'px'; $$invalidate('swipeHandler', swipeHandler);
        availableWidth = swipeWrapper.querySelector('.swipeable-items').offsetWidth;
        for (let i = 0; i < items; i++) {
          elems[i].style.transform = 'translate3d(' + (availableWidth * i) + 'px, 0, 0)';    }
        diff = 0;
        if(defaultIndex){
          changeItem(defaultIndex);
        }
      }

      function init(){
        elems = swipeWrapper.querySelectorAll('.swipeable-item');
        $$invalidate('items', items = elems.length);
        update();
      }

      onMount(() => {
        init();
        window.addEventListener('resize', update);
      });

      onDestroy(()=>{
        window.removeEventListener('resize', update);
      });

      function moveHandler(e){
        if (touching) {
          e.stopImmediatePropagation();
          e.stopPropagation();


          let max = availableWidth;

          let _x = e.touches ? e.touches[0].pageX : e.pageX;
          let _diff = (x - _x) + posX;
          dir = _x > x ? 0 : 1;
          if (!dir) { _diff = posX - (_x - x); }
          if (_diff <= (max * (items - 1)) && _diff >= min) {
            slotWrapper.style.transform = `translate3d(${-diff}px, 0, 0)`; $$invalidate('slotWrapper', slotWrapper);
            diff = _diff;
          }
          $$invalidate('touched', touched = true);
        }
      }

      function endHandler(e) {
        e && e.stopImmediatePropagation();
        e && e.stopPropagation();
        e && e.preventDefault();

        let max = availableWidth;

        $$invalidate('touching', touching = false);
        x = null;



        let swipe_threshold = 0.85;
        let d_max = (diff / max);
        let _target = Math.round(d_max + .25 * (dir || -1));

        if(Math.abs(_target - d_max) < swipe_threshold ){
          diff = _target * max;
        }else{
          diff = (dir ? (_target - 1) : (_target + 1)) * max;
        }

        posX = diff;
        $$invalidate('activeIndicator', activeIndicator = (diff / max));
        slotWrapper.style.transform = `translate3d(${-posX}px, 0, 0)`; $$invalidate('slotWrapper', slotWrapper);

        window.removeEventListener('mousemove', moveHandler);
        window.removeEventListener('mouseup', endHandler);
        window.removeEventListener('touchmove', moveHandler);
        window.removeEventListener('touchend', endHandler);
      }

      function moveStart(e){
        e.stopImmediatePropagation();
        e.stopPropagation();
        e.preventDefault();

        $$invalidate('touching', touching = true);
        x = e.touches ? e.touches[0].pageX : e.pageX;
        window.addEventListener('mousemove', moveHandler);
        window.addEventListener('mouseup', endHandler);
        window.addEventListener('touchmove', moveHandler);
        window.addEventListener('touchend', endHandler);
      }

      function changeItem(item) {
        let max = availableWidth;
        diff = max * item;
        $$invalidate('activeIndicator', activeIndicator = item);
        endHandler();
      }

      function changeView() {
        changeItem(played);
        played = played < (items - 1) ? ++played : 0;  }

      function next(){
        let item = activeIndicator + 1;
        if(item >= items && loop){
          item = 0;
        }
        if(item < items){
          changeItem(item);
        }
      }

      function previous(){
        let item = activeIndicator - 1;
        if(item < 0 && loop){
          item = items - 1;
        }
        if(item >= 0){
          changeItem(item);
        }
      }

    	const writable_props = ['transitionDuration', 'showIndicators', 'autoplay', 'delay', 'defaultIndex', 'loop', 'showControls', 'activeIndicator'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<Swipe> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	function div0_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('slotWrapper', slotWrapper = $$value);
    		});
    	}

    	function transitionend_handler() {
    		const $$result = touched=false;
    		$$invalidate('touched', touched);
    		return $$result;
    	}

    	function div2_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('swipeWrapper', swipeWrapper = $$value);
    		});
    	}

    	function div3_binding($$value) {
    		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
    			$$invalidate('swipeHandler', swipeHandler = $$value);
    		});
    	}

    	function click_handler({ i }) {changeItem(i);}

    	function click_handler_1() {
    		const $$result = autoplay=false;
    		$$invalidate('autoplay', autoplay);
    		return $$result;
    	}

    	function click_handler_2() {
    		const $$result = autoplay=true;
    		$$invalidate('autoplay', autoplay);
    		return $$result;
    	}

    	$$self.$set = $$props => {
    		if ('transitionDuration' in $$props) $$invalidate('transitionDuration', transitionDuration = $$props.transitionDuration);
    		if ('showIndicators' in $$props) $$invalidate('showIndicators', showIndicators = $$props.showIndicators);
    		if ('autoplay' in $$props) $$invalidate('autoplay', autoplay = $$props.autoplay);
    		if ('delay' in $$props) $$invalidate('delay', delay = $$props.delay);
    		if ('defaultIndex' in $$props) $$invalidate('defaultIndex', defaultIndex = $$props.defaultIndex);
    		if ('loop' in $$props) $$invalidate('loop', loop = $$props.loop);
    		if ('showControls' in $$props) $$invalidate('showControls', showControls = $$props.showControls);
    		if ('activeIndicator' in $$props) $$invalidate('activeIndicator', activeIndicator = $$props.activeIndicator);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	$$self.$$.update = ($$dirty = { items: 1, autoplay: 1, run_interval: 1, delay: 1 }) => {
    		if ($$dirty.items) { $$invalidate('indicators', indicators = Array(items)); }
    		if ($$dirty.autoplay || $$dirty.run_interval || $$dirty.delay) { {
            if(autoplay && !run_interval){
              $$invalidate('run_interval', run_interval = setInterval(changeView , delay));
            }
        
            if(!autoplay && run_interval){
              clearInterval(run_interval);
              $$invalidate('run_interval', run_interval = false);
            }
          } }
    	};

    	return {
    		transitionDuration,
    		showIndicators,
    		autoplay,
    		delay,
    		defaultIndex,
    		loop,
    		showControls,
    		activeIndicator,
    		indicators,
    		swipeWrapper,
    		swipeHandler,
    		slotWrapper,
    		touching,
    		touched,
    		moveStart,
    		changeItem,
    		next,
    		previous,
    		div0_binding,
    		transitionend_handler,
    		div2_binding,
    		div3_binding,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		$$slots,
    		$$scope
    	};
    }

    class Swipe extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, ["transitionDuration", "showIndicators", "autoplay", "delay", "defaultIndex", "loop", "showControls", "activeIndicator"]);
    	}

    	get transitionDuration() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set transitionDuration(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showIndicators() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showIndicators(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get autoplay() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set autoplay(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get delay() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set delay(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get defaultIndex() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set defaultIndex(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get loop() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set loop(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showControls() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showControls(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get activeIndicator() {
    		throw new Error("<Swipe>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set activeIndicator(value) {
    		throw new Error("<Swipe>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src\SwipeItem.svelte generated by Svelte v3.9.1 */

    const file$1 = "src\\SwipeItem.svelte";

    function create_fragment$1(ctx) {
    	var div, div_class_value, current;

    	const default_slot_template = ctx.$$slots.default;
    	const default_slot = create_slot(default_slot_template, ctx, null);

    	return {
    		c: function create() {
    			div = element("div");

    			if (default_slot) default_slot.c();

    			attr(div, "class", div_class_value = "swipeable-item " + ctx.classes + " svelte-exn8e7");
    			add_location(div, file$1, 15, 0, 224);
    		},

    		l: function claim(nodes) {
    			if (default_slot) default_slot.l(div_nodes);
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},

    		p: function update(changed, ctx) {
    			if (default_slot && default_slot.p && changed.$$scope) {
    				default_slot.p(
    					get_slot_changes(default_slot_template, ctx, changed, null),
    					get_slot_context(default_slot_template, ctx, null)
    				);
    			}

    			if ((!current || changed.classes) && div_class_value !== (div_class_value = "swipeable-item " + ctx.classes + " svelte-exn8e7")) {
    				attr(div, "class", div_class_value);
    			}
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			if (default_slot) default_slot.d(detaching);
    		}
    	};
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { classes = '' } = $$props;

    	const writable_props = ['classes'];
    	Object.keys($$props).forEach(key => {
    		if (!writable_props.includes(key) && !key.startsWith('$$')) console.warn(`<SwipeItem> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ('classes' in $$props) $$invalidate('classes', classes = $$props.classes);
    		if ('$$scope' in $$props) $$invalidate('$$scope', $$scope = $$props.$$scope);
    	};

    	return { classes, $$slots, $$scope };
    }

    class SwipeItem extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, ["classes"]);
    	}

    	get classes() {
    		throw new Error("<SwipeItem>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set classes(value) {
    		throw new Error("<SwipeItem>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* dev\App.svelte generated by Svelte v3.9.1 */

    const file$2 = "dev\\App.svelte";

    // (75:6) <SwipeItem>
    function create_default_slot_9(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "./images/1.jpg");
    			attr(img, "alt", "");
    			attr(img, "class", "svelte-1k7khib");
    			add_location(img, file$2, 75, 8, 1450);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (79:6) <SwipeItem>
    function create_default_slot_8(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "./images/2.jpg");
    			attr(img, "alt", "");
    			attr(img, "class", "svelte-1k7khib");
    			add_location(img, file$2, 79, 8, 1534);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (83:6) <SwipeItem>
    function create_default_slot_7(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "./images/3.jpg");
    			attr(img, "alt", "");
    			attr(img, "class", "svelte-1k7khib");
    			add_location(img, file$2, 83, 8, 1618);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (87:6) <SwipeItem>
    function create_default_slot_6(ctx) {
    	var img;

    	return {
    		c: function create() {
    			img = element("img");
    			attr(img, "src", "./images/4.jpg");
    			attr(img, "alt", "");
    			attr(img, "class", "svelte-1k7khib");
    			add_location(img, file$2, 87, 8, 1702);
    		},

    		m: function mount(target, anchor) {
    			insert(target, img, anchor);
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(img);
    			}
    		}
    	};
    }

    // (74:4) <Swipe {showIndicators} {autoplay} {delay} {transitionDuration} {defaultIndex} {loop} {showControls}>
    function create_default_slot_5(ctx) {
    	var t0, t1, t2, current;

    	var swipeitem0 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_9] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem1 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_8] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem2 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_7] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem3 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_6] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			swipeitem0.$$.fragment.c();
    			t0 = space();
    			swipeitem1.$$.fragment.c();
    			t1 = space();
    			swipeitem2.$$.fragment.c();
    			t2 = space();
    			swipeitem3.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(swipeitem0, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(swipeitem1, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(swipeitem2, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(swipeitem3, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var swipeitem0_changes = {};
    			if (changed.$$scope) swipeitem0_changes.$$scope = { changed, ctx };
    			swipeitem0.$set(swipeitem0_changes);

    			var swipeitem1_changes = {};
    			if (changed.$$scope) swipeitem1_changes.$$scope = { changed, ctx };
    			swipeitem1.$set(swipeitem1_changes);

    			var swipeitem2_changes = {};
    			if (changed.$$scope) swipeitem2_changes.$$scope = { changed, ctx };
    			swipeitem2.$set(swipeitem2_changes);

    			var swipeitem3_changes = {};
    			if (changed.$$scope) swipeitem3_changes.$$scope = { changed, ctx };
    			swipeitem3.$set(swipeitem3_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem0.$$.fragment, local);

    			transition_in(swipeitem1.$$.fragment, local);

    			transition_in(swipeitem2.$$.fragment, local);

    			transition_in(swipeitem3.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipeitem0.$$.fragment, local);
    			transition_out(swipeitem1.$$.fragment, local);
    			transition_out(swipeitem2.$$.fragment, local);
    			transition_out(swipeitem3.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(swipeitem0, detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(swipeitem1, detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(swipeitem2, detaching);

    			if (detaching) {
    				detach(t2);
    			}

    			destroy_component(swipeitem3, detaching);
    		}
    	};
    }

    // (101:6) <SwipeItem>
    function create_default_slot_4(ctx) {
    	var div, button, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Say Hi";
    			attr(button, "class", "has-pointer-event svelte-1k7khib");
    			add_location(button, file$2, 102, 10, 2127);
    			attr(div, "class", "is-stack is-center svelte-1k7khib");
    			set_style(div, "background", "teal");
    			add_location(div, file$2, 101, 8, 2059);
    			dispose = listen(button, "click", sayHi);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (107:6) <SwipeItem>
    function create_default_slot_3(ctx) {
    	var div, button, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Say Hi";
    			attr(button, "class", "has-pointer-event svelte-1k7khib");
    			add_location(button, file$2, 108, 10, 2335);
    			attr(div, "class", "is-stack is-center svelte-1k7khib");
    			set_style(div, "background", "yellowgreen");
    			add_location(div, file$2, 107, 8, 2260);
    			dispose = listen(button, "click", sayHi);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (113:6) <SwipeItem>
    function create_default_slot_2(ctx) {
    	var div, button, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Say Hi";
    			attr(button, "class", "has-pointer-event svelte-1k7khib");
    			add_location(button, file$2, 114, 10, 2536);
    			attr(div, "class", "is-stack is-center svelte-1k7khib");
    			set_style(div, "background", "aqua");
    			add_location(div, file$2, 113, 8, 2468);
    			dispose = listen(button, "click", sayHi);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (119:6) <SwipeItem>
    function create_default_slot_1(ctx) {
    	var div, button, dispose;

    	return {
    		c: function create() {
    			div = element("div");
    			button = element("button");
    			button.textContent = "Say Hi";
    			attr(button, "class", "has-pointer-event svelte-1k7khib");
    			add_location(button, file$2, 120, 10, 2743);
    			attr(div, "class", "is-stack is-center svelte-1k7khib");
    			set_style(div, "background", "lightcoral");
    			add_location(div, file$2, 119, 8, 2669);
    			dispose = listen(button, "click", sayHi);
    		},

    		m: function mount(target, anchor) {
    			insert(target, div, anchor);
    			append(div, button);
    		},

    		p: noop,

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div);
    			}

    			dispose();
    		}
    	};
    }

    // (100:4) <Swipe>
    function create_default_slot(ctx) {
    	var t0, t1, t2, current;

    	var swipeitem0 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_4] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem1 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_3] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem2 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_2] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipeitem3 = new SwipeItem({
    		props: {
    		$$slots: { default: [create_default_slot_1] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			swipeitem0.$$.fragment.c();
    			t0 = space();
    			swipeitem1.$$.fragment.c();
    			t1 = space();
    			swipeitem2.$$.fragment.c();
    			t2 = space();
    			swipeitem3.$$.fragment.c();
    		},

    		m: function mount(target, anchor) {
    			mount_component(swipeitem0, target, anchor);
    			insert(target, t0, anchor);
    			mount_component(swipeitem1, target, anchor);
    			insert(target, t1, anchor);
    			mount_component(swipeitem2, target, anchor);
    			insert(target, t2, anchor);
    			mount_component(swipeitem3, target, anchor);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var swipeitem0_changes = {};
    			if (changed.$$scope) swipeitem0_changes.$$scope = { changed, ctx };
    			swipeitem0.$set(swipeitem0_changes);

    			var swipeitem1_changes = {};
    			if (changed.$$scope) swipeitem1_changes.$$scope = { changed, ctx };
    			swipeitem1.$set(swipeitem1_changes);

    			var swipeitem2_changes = {};
    			if (changed.$$scope) swipeitem2_changes.$$scope = { changed, ctx };
    			swipeitem2.$set(swipeitem2_changes);

    			var swipeitem3_changes = {};
    			if (changed.$$scope) swipeitem3_changes.$$scope = { changed, ctx };
    			swipeitem3.$set(swipeitem3_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipeitem0.$$.fragment, local);

    			transition_in(swipeitem1.$$.fragment, local);

    			transition_in(swipeitem2.$$.fragment, local);

    			transition_in(swipeitem3.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipeitem0.$$.fragment, local);
    			transition_out(swipeitem1.$$.fragment, local);
    			transition_out(swipeitem2.$$.fragment, local);
    			transition_out(swipeitem3.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			destroy_component(swipeitem0, detaching);

    			if (detaching) {
    				detach(t0);
    			}

    			destroy_component(swipeitem1, detaching);

    			if (detaching) {
    				detach(t1);
    			}

    			destroy_component(swipeitem2, detaching);

    			if (detaching) {
    				detach(t2);
    			}

    			destroy_component(swipeitem3, detaching);
    		}
    	};
    }

    function create_fragment$2(ctx) {
    	var div4, div0, h1, t1, div1, t2, div2, input0, input0_value_value, t3, input1, t4, hr, t5, div3, current, dispose;

    	var swipe0 = new Swipe({
    		props: {
    		showIndicators: ctx.showIndicators,
    		autoplay: ctx.autoplay,
    		delay: delay,
    		transitionDuration: transitionDuration,
    		defaultIndex: defaultIndex,
    		loop: loop,
    		showControls: showControls,
    		$$slots: { default: [create_default_slot_5] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	var swipe1 = new Swipe({
    		props: {
    		$$slots: { default: [create_default_slot] },
    		$$scope: { ctx }
    	},
    		$$inline: true
    	});

    	return {
    		c: function create() {
    			div4 = element("div");
    			div0 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Swipable items wrapper component for Svelte";
    			t1 = space();
    			div1 = element("div");
    			swipe0.$$.fragment.c();
    			t2 = space();
    			div2 = element("div");
    			input0 = element("input");
    			t3 = text("\r\n    Show Indicators:");
    			input1 = element("input");
    			t4 = space();
    			hr = element("hr");
    			t5 = space();
    			div3 = element("div");
    			swipe1.$$.fragment.c();
    			attr(h1, "class", "svelte-1k7khib");
    			add_location(h1, file$2, 70, 4, 1222);
    			attr(div0, "class", "desc-holder svelte-1k7khib");
    			add_location(div0, file$2, 69, 2, 1191);
    			attr(div1, "class", "swipe-holder svelte-1k7khib");
    			add_location(div1, file$2, 72, 2, 1288);
    			attr(input0, "type", "button");
    			input0.value = input0_value_value = ctx.autoplay ? 'Stop': 'Play';
    			attr(input0, "class", "svelte-1k7khib");
    			add_location(input0, file$2, 92, 4, 1816);
    			attr(input1, "type", "checkbox");
    			attr(input1, "class", "svelte-1k7khib");
    			add_location(input1, file$2, 93, 20, 1911);
    			attr(div2, "class", "option-holder svelte-1k7khib");
    			add_location(div2, file$2, 91, 2, 1783);
    			attr(hr, "class", "svelte-1k7khib");
    			add_location(hr, file$2, 96, 2, 1981);
    			attr(div3, "class", "swipe-holder svelte-1k7khib");
    			add_location(div3, file$2, 98, 2, 1991);
    			attr(div4, "class", "container svelte-1k7khib");
    			add_location(div4, file$2, 68, 0, 1163);

    			dispose = [
    				listen(input0, "click", ctx.toggle),
    				listen(input1, "change", ctx.input1_change_handler)
    			];
    		},

    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},

    		m: function mount(target, anchor) {
    			insert(target, div4, anchor);
    			append(div4, div0);
    			append(div0, h1);
    			append(div4, t1);
    			append(div4, div1);
    			mount_component(swipe0, div1, null);
    			append(div4, t2);
    			append(div4, div2);
    			append(div2, input0);
    			append(div2, t3);
    			append(div2, input1);

    			input1.checked = ctx.showIndicators;

    			append(div4, t4);
    			append(div4, hr);
    			append(div4, t5);
    			append(div4, div3);
    			mount_component(swipe1, div3, null);
    			current = true;
    		},

    		p: function update(changed, ctx) {
    			var swipe0_changes = {};
    			if (changed.showIndicators) swipe0_changes.showIndicators = ctx.showIndicators;
    			if (changed.autoplay) swipe0_changes.autoplay = ctx.autoplay;
    			if (changed.delay) swipe0_changes.delay = delay;
    			if (changed.transitionDuration) swipe0_changes.transitionDuration = transitionDuration;
    			if (changed.defaultIndex) swipe0_changes.defaultIndex = defaultIndex;
    			if (changed.loop) swipe0_changes.loop = loop;
    			if (changed.showControls) swipe0_changes.showControls = showControls;
    			if (changed.$$scope) swipe0_changes.$$scope = { changed, ctx };
    			swipe0.$set(swipe0_changes);

    			if ((!current || changed.autoplay) && input0_value_value !== (input0_value_value = ctx.autoplay ? 'Stop': 'Play')) {
    				input0.value = input0_value_value;
    			}

    			if (changed.showIndicators) input1.checked = ctx.showIndicators;

    			var swipe1_changes = {};
    			if (changed.$$scope) swipe1_changes.$$scope = { changed, ctx };
    			swipe1.$set(swipe1_changes);
    		},

    		i: function intro(local) {
    			if (current) return;
    			transition_in(swipe0.$$.fragment, local);

    			transition_in(swipe1.$$.fragment, local);

    			current = true;
    		},

    		o: function outro(local) {
    			transition_out(swipe0.$$.fragment, local);
    			transition_out(swipe1.$$.fragment, local);
    			current = false;
    		},

    		d: function destroy(detaching) {
    			if (detaching) {
    				detach(div4);
    			}

    			destroy_component(swipe0);

    			destroy_component(swipe1);

    			run_all(dispose);
    		}
    	};
    }

    let delay = 2000;

    let transitionDuration = 200;

    let defaultIndex = 0;

    let loop = true;

    let showControls = true;

    function sayHi(){
      alert('Hi');
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let autoplay = false;
      let showIndicators = false;

      function toggle(){
        $$invalidate('autoplay', autoplay = !autoplay);
      }

    	function input1_change_handler() {
    		showIndicators = this.checked;
    		$$invalidate('showIndicators', showIndicators);
    	}

    	return {
    		autoplay,
    		showIndicators,
    		toggle,
    		input1_change_handler
    	};
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, []);
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
