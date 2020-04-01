<script>

  import { onMount, onDestroy, createEventDispatcher } from 'svelte';

  const dispatch = createEventDispatcher();

  //export let transitionDuration = 200;
  export let showIndicators = false;
  export let autoplay = false;
  export let delay = 1000;
  export let defaultIndex = 0;
  export let loop = false;
  export let showControls = false;


  export let activeIndicator = 0;
  let indicators;
  let items = 0;
  let availableWidth = 0;
  let topClearence = 0;

  let elems;
  let diff = 0;

  let swipeWrapper;
  let swipeHandler;
  let slotWrapper;

  let min = 0;
  let touching = false;
  let touched = false;
  let posX = 0;
  let dir = 0;
  let x;



  let played = defaultIndex || 0;
  let run_interval = false;

  $: indicators = Array(items);

  $: {
    if(autoplay && !run_interval){
      run_interval = setInterval(changeView , delay);
    }

    if(!autoplay && run_interval){
      clearInterval(run_interval)
      run_interval = false;
    }
  }


  function update(){
    swipeHandler.style.top = topClearence + 'px';
    availableWidth = swipeWrapper.querySelector('.swipeable-items').offsetWidth;
    for (let i = 0; i < items; i++) {
      elems[i].style.transform = 'translate3d(' + (availableWidth * i) + 'px, 0, 0)';
    }
    diff = 0;
    if(defaultIndex){
      changeItem(defaultIndex);
    }
  }

  function init(){
    elems = swipeWrapper.querySelectorAll('.swipeable-item');
    items = elems.length;
    update();
  }

  onMount(() => {
    init();
    window.addEventListener('resize', update);
  });

  onDestroy(()=>{
    window.removeEventListener('resize', update);
  })

  function moveHandler(e){
    if (touching) {
      e.stopImmediatePropagation();
      e.stopPropagation();


      let max = availableWidth;

      let _x = e.touches ? e.touches[0].pageX : e.pageX;
      let _diff = (x - _x) + posX;
      dir = _x > x ? 0 : 1;
      if (!dir) { _diff = posX - (_x - x) }
      if (_diff <= (max * (items - 1)) && _diff >= min) {
        slotWrapper.style.transform = `translate3d(${-diff}px, 0, 0)`
        diff = _diff;
      }
      touched = true
    }
  }

  function endHandler(e) {
    e && e.stopImmediatePropagation();
    e && e.stopPropagation();
    e && e.preventDefault();

    let max = availableWidth;

    touching = false;
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
    activeIndicator = (diff / max);
    slotWrapper.style.transform = `translate3d(${-posX}px, 0, 0)`;

    window.removeEventListener('mousemove', moveHandler);
    window.removeEventListener('mouseup', endHandler);
    window.removeEventListener('touchmove', moveHandler);
    window.removeEventListener('touchend', endHandler);
  }

  function moveStart(e){
    e.stopImmediatePropagation();
    e.stopPropagation();
    e.preventDefault();

    touching = true;
    x = e.touches ? e.touches[0].pageX : e.pageX;
    window.addEventListener('mousemove', moveHandler);
    window.addEventListener('mouseup', endHandler);
    window.addEventListener('touchmove', moveHandler);
    window.addEventListener('touchend', endHandler);
  }

  function changeItem(item) {
    let max = availableWidth;
    diff = max * item;
    activeIndicator = item;
    endHandler();
  }

  function changeView() {
    changeItem(played);
    played = played < (items - 1) ? ++played : 0;
  }

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

</script>

<style>

.swipe-panel {
  position: relative;
  height: var(--sv-swipe-panel-height, 100%);
  width: var(--sv-swipe-panel-width, inherit);
}
.swipe-item-wrapper{
  overflow: hidden;
  position: relative;
  height: inherit;
  z-index: var(--sv-swipe-panel-wrapper-index, 2);
  pointer-events: none;
}

.swipeable-items,
.swipeable-slot-wrapper {
  position: relative;
  width: inherit;
  height: inherit;
}

.swipeable-slot-wrapper {
  transition: transform .3s ease-out;
}

.swipeable-slot-wrapper.touching {
  transition-duration: 0s;
}

.swipeable-slot-wrapper.touched {
  transition-timing-function: linear;
  transition-duration: .15s
}

.swipe-handler {
  width: 100%;
  position: absolute;
  top: 40px;
  bottom: 0px;
  left: 0;
  right: 0;
  background: rgba(0,0,0,0);
}
.swipe-indicator {
  position: relative;
  bottom: 1.5rem;
  display: flex;
  justify-content: center;
  z-index: var(--sv-swipe-panel-wrapper-index, 2);
  pointer-events: none;
}

.dot {
  height: 10px;
  width: 10px;
  background-color: transparent;
  border: 1px solid grey;
  border-radius: 50%;
  display: inline-block;
  margin: 0px 2px;
  cursor: pointer;
  pointer-events: fill;
}
.swipe-indicator .is-active {
  background-color: var(--sv-swipe-indicator-active-color, grey);
}

  .control {
    position: absolute;
    top: 50%;
    transform: translate(0, -50%);
    z-index: 2;
  }

  .left {
    left: 0
  }

  .right {
    right: 0;
  }

  .play, .pause {
    top: auto;
    bottom: 0;
    left: 50%;
    transform: translate(-50%, 0)
  }

</style>

<div class="swipe-panel">
  <div class="swipe-item-wrapper" bind:this={swipeWrapper}>
    <div class="swipeable-items">
      <div class="swipeable-slot-wrapper" class:touching={touching} class:touched={touched} bind:this={slotWrapper}
          on:transitionend={()=>touched=false}>
        <slot />
      </div>
    </div>
  </div>
  <div class="swipe-handler" bind:this={swipeHandler} on:touchstart={moveStart} on:mousedown={moveStart}></div>
  {#if showIndicators}
     <div class="swipe-indicator swipe-indicator-inside">
        {#each indicators as x, i }
          <span class="dot {activeIndicator == i ? 'is-active' : ''}" on:click={() => {changeItem(i)}}></span>
        {/each}
    </div>
  {/if}

  {#if showControls}
    <a href="javascript:" on:click={previous} class="control left"><slot name="previous">&laquo;</slot></a>
    <a href="javascript:" on:click={next} class="control right"><slot name="next">&raquo;</slot></a>
    {#if autoplay}
      <a href="javascript:" on:click={() => autoplay=false} class="control pause"><slot name="pause">||</slot></a>
    {:else}
      <a href="javascript:" on:click={() => autoplay=true} class="control play"><slot name="play">&gt;</slot></a>
    {/if}
  {/if}
</div>
