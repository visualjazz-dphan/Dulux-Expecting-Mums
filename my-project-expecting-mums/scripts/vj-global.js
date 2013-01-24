var MYPROJECT = MYPROJECT || {};

MYPROJECT.expectingmums = (function () {
		
		expectingMums = {
			 init: function (){
				this.colorRoom();
				this.idealNursery();
				this.sickyNursery();
				this.styleCredit();
			},
			colorRoom : function(){
				var	scrollbar =  $("#expect-mums-thumbnails"),
				    numberColors = scrollbar.find("li"),
					room = $("#expect-mums-banner"),
					currentScrollBar = 0,
					loopInterval = null;
					
				//Get the current width for list of colors
				currentScrollBar = numberColors.length * 79 - 4;
				numberColors.parent("ul").css({"width": currentScrollBar});
				
				//Color the thumbnail items
				 $(numberColors).each(function(){
					$(this).css({"background" : $(this).find("a").attr("data-color")});
					$(this).find("a").attr("href", $(this).find("a").attr("data-color"));
				})	
				
				//Looping color
				/*loopColor = function(){
					
						$(numberColors).each(function(index, elm){
						console.log($(elm))
						setTimeout(function(){
						 if(stopLoop) {													
							 room.animate({'backgroundColor' : $(elm).find("a").attr("data-color")});
							 $(numberColors).removeClass("active");
							 $(elm).addClass("active");	
						 }							 								 
						}, index * 2000)
					})
				}	
				*/
				
				//Looping color
				loopColor = function(){
						var nextActiveIndex  = scrollbar.find("li.active").length ? scrollbar.find("li").index(scrollbar.find("li.active")) + 1 : 0;
						room.animate({'backgroundColor' : scrollbar.find("li").eq(nextActiveIndex).find("a").attr("data-color")});
						$(numberColors).removeClass("active");
						scrollbar.find("li").eq(nextActiveIndex).addClass("active");
				}	
				
				$(window).load(function(){
						loopColor();
						loopInterval = setInterval(function(){
							loopColor();
						}, 2000)
				});
				
				//Color the thumbnail items
				$(numberColors).find("a").click(function(e){
					room.animate({'backgroundColor' : $(this).attr("data-color")});
					$(this).parent("li").addClass("active").siblings("li").removeClass("active");	
					clearInterval(loopInterval);
					e.preventDefault();
				})	
				
				//Mousewheel function for horizontal scrollbar
				scrollbar.bind('mousewheel', function(event, delta) {	
					val = this.scrollLeft - (delta * 70);
					$(this).stop().animate({scrollLeft:val},0);
				})/*.mouseenter(function(){
					$("body, html").css({"overflow-y":"hidden", "white-space": "nowrap"})	
				}).mouseleave(function(){
					$("body, html").css({"overflow-y":"auto"})	
				})*/
			},
			idealNursery : function(){
				var nurseryContent = $("#expect-mums-nursery"),
					nurseryItem = nurseryContent.find("li > a");					
					
				//Hover state for ideal nursery item
				$(nurseryItem).hover(function(){
					$(this).stop().animate({"top": "30px"});	
				}, function(){
					if($(this).hasClass("active")){
						$(this).stop().animate({"top": "30px"}, "fast");	
					} else {
						$(this).stop().animate({"top": "0"}, "fast");
					}
				})
			}, 
			sickyNursery : function(){
				var nurseryContent = $("#expect-mums-nursery"),
					nurseryPos = $("#dreamy-baby-content").position().top - 100,
					nurseryEndPos = $(".expect-mums-intro-product").position().top - 100;
									
				//Sticky nursery show/hide when scrolling window 	
				$(window).scroll(function(){
					var scrollPos = $(this).scrollTop();
						if(scrollPos >= nurseryPos){
							nurseryContent.css({"position":"fixed", "left":0, "top":-100, "padding":0});
							nurseryContent.find("h3").hide();
						} else{
							nurseryContent.css({'position': 'relative', "left":0, "top":0, "padding":"20px 0"});
							nurseryContent.find("h3").show();
							nurseryContent.find("a").removeClass("active").stop().animate({"top": "0"}, "fast");
						}	
						
					nurseryContent.find("a").each( function() {
						var $divId = $(this).attr("href"),
							divOffset = $($divId).offset().top - 110;
						if( scrollPos >= divOffset) {
							nurseryContent.find("a").removeClass("active").stop().animate({"top": "-15px"}, "fast");
							$(this).addClass("active").stop().animate({"top": "30px"}, "fast");	
						} if(scrollPos > nurseryEndPos){
							nurseryContent.css({"position":"fixed", "left":0, "top":-100, "padding":0});
							nurseryContent.find("a").removeClass("active").stop().animate({"top": "0"}, "fast");
						}	
		   			});		
				})	
				
				//Hash tag to land the correct content
				nurseryContent.find("a").click(function(e){
					var currentPos = $(this.hash).offset().top;
					nurseryContent.find("a").removeClass("active").stop().animate({"top": "-15px"}, "fast");
					$(this).addClass("active").stop().animate({"top": "30px"}, "fast");
					$("body, html").animate({scrollTop: currentPos - 100}, "slow");
					e.preventDefault();
				})
			}, 
			styleCredit : function(){
				var currentColumns = $(".expect-mums-credits-content");
				$(currentColumns).each(function(){
					var currentHeight = $(this).parent(".em-credits-main-content").height() - 60;
					$(this).height(currentHeight);
				})	
			}
		}
		
	// public functions
	return {
		init: function () {
			expectingMums.init();
		}
	};

}());
