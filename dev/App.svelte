<script>
  import { Swipe, SwipeItem } from "../src/index.js";
  let autoplay = false;
  let delay = 2000;
  let showIndicators = false;
  let transitionDuration = 200;
  let defaultIndex = 0;
  let loop = true;
  let showControls = true;

  function toggle(){
    autoplay = !autoplay;
  }

  function sayHi(){
    alert('Hi')
  }

</script>

<style>
  :root{
    --sv-swipe-indicator-active-color:white;
  }
  .container, .is-stack{
    height: 100%;
    width: 100%;
  }
  .swipe-holder{
    height: 30vh;
    width: 100%;
  }
  .desc-holder{
    padding: 20px 20px;
  }

  .desc-holder h1{
    font-size: 3vh;
  }
  .option-holder input{
    padding: 10px 10px;
    margin: 10px;
  }

  button{
    background-color: #4CAF50;
    border: none;
    color: white;
    padding: 15px 32px;
    text-align: center;
    text-decoration: none;
    display: inline-block;
    font-size: 16px;
  }
  .is-center{
    display: flex;
    justify-content: center;
    align-items: center;
  }
  img{
    max-width: 100%;
    height: auto;
  }
  .has-pointer-event{
    pointer-events:fill;
  }
</style>

<div class="container" >
  <div class="desc-holder">
    <h1>Swipable items wrapper component for Svelte</h1>
  </div>
  <div class="swipe-holder">
    <Swipe {showIndicators} {autoplay} {delay} {transitionDuration} {defaultIndex} {loop} {showControls}>
      <SwipeItem>
        <img src="./images/1.jpg" alt="">
      </SwipeItem>

      <SwipeItem>
        <img src="./images/2.jpg" alt="">
      </SwipeItem>

      <SwipeItem>
        <img src="./images/3.jpg" alt="">
      </SwipeItem>

      <SwipeItem>
        <img src="./images/4.jpg" alt="">
      </SwipeItem>
    </Swipe>
  </div>
  <div class="option-holder">
    <input type="button" on:click={toggle} value={autoplay ? 'Stop': 'Play'}>
    Show Indicators:<input type="checkbox" bind:checked={showIndicators}> 
  </div>

  <hr>

  <div class="swipe-holder">
    <Swipe>
      <SwipeItem>
        <div class="is-stack is-center" style="background:teal">
          <button class="has-pointer-event" on:click={sayHi}>Say Hi</button>
        </div>
      </SwipeItem>

      <SwipeItem>
        <div class="is-stack is-center" style="background:yellowgreen">
          <button class="has-pointer-event" on:click={sayHi}>Say Hi</button>
        </div>
      </SwipeItem>

      <SwipeItem>
        <div class="is-stack is-center" style="background:aqua">
          <button class="has-pointer-event" on:click={sayHi}>Say Hi</button>
        </div>
      </SwipeItem>

      <SwipeItem>
        <div class="is-stack is-center" style="background:lightcoral">
          <button class="has-pointer-event" on:click={sayHi}>Say Hi</button>
        </div>
      </SwipeItem>
    </Swipe>
  </div>
</div>

