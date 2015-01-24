# active-background-animator

> **PLEASE NOTE:** This project is still in early stage. A huge amount of development is still required. The structure will change making some animations obsolete.

### Make your content more atractive

This is a JavaScript library using jQuery to add background animations to HTML elements.  
The purpose is to make the design dynamic more than bringing actual functionalities to the website.

## Download

Get the [development](https://raw.githubusercontent.com/repraze/active-background-animator/master/lib/jquery.active-background-animator.js) version.

## Getting Started

active-background-animator.js is easy to use and highly configurable. Here is a simple example:

``` js
$('header').activeBackgroundAnimator("ActiveGraph");
```

It is possible to stack animations together to make more complex animations by simply passing an array of animation:

``` js
$('header').activeBackgroundAnimator(["ActiveGraph","ActiveGraph"]);
```

To specify the options of an animation pass objects containing the name and the options instead of a string:

``` js
$('header').activeBackgroundAnimator({name:"ActiveGraph",options:{someOptions:true}});
```

Combining all the definition above will allow you to create what you need easily in many different ways:

``` js
$("header").activeBackgroundAnimator(["ActiveGraph",{name:"ActiveGraph",options:{nodeColor:"#ff0000"}}]);
```

## License

Copyright 2015, Thomas Dubosc  
This content is released under the MIT license  
