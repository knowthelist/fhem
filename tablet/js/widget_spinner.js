/* FTUI Plugin
* Copyright (c) 2016 Mario Stephan <mstephan@shared-files.de>
* Under MIT License (http://www.opensource.org/licenses/mit-license.php)
*/

if(typeof widget_widget == 'undefined') {
    loadplugin('widget_widget');
}

$('head').append('<link rel="stylesheet" href="'+ dir + '/../css/ftui_spinner.css" type="text/css" />');

var widget_spinner = $.extend({}, widget_widget, {
    widgetname : 'spinner',
    drawLevel: function(elem) {
        var max         = parseFloat(( $.isNumeric(elem.data('max')) ) ? elem.data('max') : elem.getReading('max').val);
        var min         = parseFloat(( $.isNumeric(elem.data('min')) ) ? elem.data('min') : elem.getReading('min').val);
        var width       = parseFloat(elem.data('width'))/2;
        var value       = parseFloat(elem.data('value'));
        var color       = elem.mappedColor('color');
        var gradColor   = elem.data('gradient-color');
        var valueRel    = (value-min) / (max-min);
        var pixel       = width * valueRel;
        var levelRange  = elem.find('.levelRange');
        if (levelRange ) {
           // draw bar position / width
           levelRange.css({
              left: elem.hasClass('positiononly')  ? (pixel-valueRel*10) + 'px': '0px',
              width: elem.hasClass('positiononly') ? '10px' : pixel + 'px',
            });
            // draw gradient bar
            if ( $.isArray(gradColor) && gradColor.length > 1 ){
                var mid      = 100 * valueRel - 50;
                var stopHigh = parseInt(mid-mid/2);
                var stopLow  = parseInt(mid+mid/2);
                var colorLow = mapColor(gradColor[0]);
                var colorHigh = mapColor(gradColor[1]);
                var gradient = colorHigh +' '+ stopHigh +'%,'+
                               colorLow  +' '+ stopLow +'%)';
                if (elem.hasClass('positiononly')){
                    levelRange.css({
                      background: this.getGradientColor(colorLow,colorHigh,valueRel),
                    });
                }
                else{
                   levelRange.css({ background: '-webkit-linear-gradient(right, '+gradient,}); /* Chrome10-25,Safari5.1-6 */
                   levelRange.css({ background: 'linear-gradient(to left, '+gradient,}); /* W3C, IE10+, FF16+, Chrome26+, Opera12+, Safari7+ */
                }
            }
            else {
                // draw uni color bar
                levelRange.css({ background: color, });
            }
        }
        if ( elem.hasClass('value') || elem.hasClass('valueonly') ) {
            elem.find('.spinnerText').text(value+elem.data('unit'));
         }
    },
    onClicked: function(elem,factor) {
        var base    = this;
        var step    = parseFloat(elem.data('step'));
        var min     = parseFloat(elem.data('min'));
        var max     = parseFloat(elem.data('max'));
        var value   = parseFloat(elem.data('value'));
        clearTimeout(elem.delayTimer);
        changeValue = function() {
            value = value + factor * step;
            if ( value < min ) value = min;
            if ( value > max ) value = max;
            elem.data('value',value);
            base.drawLevel(elem);
        };
        // short press
        changeValue();
        elem.delayTimer = setTimeout(function () {
            elem.repeatTimer = setInterval(function () {
                // long press
                changeValue();
            }, 80);
        }, 500);
    },
    onReleased: function(elem) {
        clearTimeout(elem.repeatTimer);
        clearTimeout(elem.delayTimer);
            var base = this;
            elem.delayTimer = setTimeout(function () {
                var cmdl = [elem.data('cmd'),elem.data('device'),elem.data('set'),elem.data('value')].join(' ');
                setFhemStatus(cmdl);
                TOAST && $.toast(cmdl);
                elem.delayTimer=0;
            }, 500);
    },
    init_attr : function(elem) {
        elem.initData('get'                     ,'STATE');
        elem.initData('set'                     ,'');
        elem.initData('cmd'                     ,'set');
        elem.initData('color'                   ,getClassColor(elem) || getStyle('.'+this.widgetname,'color') || '#aa6900');
        elem.initData('gradient-color'          ,[]);
        elem.initData('background-color'        ,getStyle('.'+this.widgetname,'background-color')    || '#4a4a4a');
        elem.initData('icon-left-color'         ,getStyle('.'+this.widgetname,'icon-left-color')    || '#aaa');
        elem.initData('icon-right-color'        ,getStyle('.'+this.widgetname,'icon-right-color')   || '#aaa');
        elem.initData('text-color'              ,getStyle('.'+this.widgetname,'text-color')    || '#ccc');
        elem.initData('icon-left'               ,elem.data('icon') || null);
        elem.initData('icon-right'              ,null);
        elem.initData('width'                   ,'200');
        elem.initData('height'                  ,'50');
        elem.initData('value'                   ,'0');
        elem.initData('min'                     ,'0');
        elem.initData('max'                     ,'100');
        elem.initData('step'                    ,'1');
        elem.initData('unit'                    ,'');
        elem.initData('get-value'               ,elem.data('part') || -1);

        elem.addReading('get');
        if ( elem.isDeviceReading('text-color') ) {elem.addReading('text-color');}
    },
    init_ui : function(elem) {
        var base = this;
        var leftIcon = elem.data('icon-left');
        var rightIcon = elem.data('icon-right');

        // prepare container element
        elem.html('')
            .addClass('spinner')
            .css({
                width: elem.data('width')+'px',
                maxWidth: elem.data('width')+'px',
                height: elem.data('height')+'px',
                lineHeight: elem.data('height')*0.9+'px',
                color: elem.mappedColor('text-color'),
                backgroundColor: elem.mappedColor('background-color'),
        });

        // prepare left icon
        var elemLeftIcon=jQuery('<div/>', {
            class: 'lefticon',
        })
        .css({
            color: elem.mappedColor('icon-left-color'),
        })
        .prependTo(elem);
        if (leftIcon)
            elemLeftIcon.addClass('fa '+ leftIcon +' fa-lg fa-fw');
        else
            elemLeftIcon.html('-');

        // prepare level element
        var levelArea = jQuery('<div/>', {
            class: 'levelArea',
        }).css({
              width: '50%',
        })
        .appendTo(elem);

        //levelRange
        jQuery('<div/>', {
            class: 'levelRange',
        }).appendTo(levelArea);

        // prepare right icon
        var elemRightIcon=jQuery('<div/>', {
            class: 'righticon',
        })
        .css({
            color: elem.mappedColor('icon-right-color'),
        })
        .appendTo(elem);
        if (rightIcon)
            elemRightIcon.addClass('fa '+ rightIcon +' fa-lg fa-fw');
        else
            elemRightIcon.html('+');

        // prepare text element
        if ( elem.hasClass('value') || elem.hasClass('valueonly') ) {
          jQuery('<div/>', {
              class : 'spinnerText',
          }).css({
             width: '50%',
        }).appendTo(elem);
        }

        // event handler
        var clickEventType=((document.ontouchstart!==null)?'mousedown':'touchstart');
        var releaseEventType=((document.ontouchend!==null)?'mouseup':'touchend');
        var leaveEventType=((document.ontouchleave!==null)?'mouseout':'touchleave');

        // UP button
        elemRightIcon.on(clickEventType,function() {
            elemRightIcon.fadeTo( "fast" , 0.5);
            base.onClicked.call(base,elem,1);
        });
        elemRightIcon.on(releaseEventType + ' ' + leaveEventType,function() {
            elemRightIcon.fadeTo( "fast" , 1);
            if (elem.delayTimer)
                base.onReleased.call(base,elem);
        });

        // DOWN button
        elemLeftIcon.on(clickEventType,function() {
            elemLeftIcon.fadeTo( "fast" , 0.5);
            base.onClicked.call(base,elem,-1);
        });
        elemLeftIcon.on(releaseEventType + ' ' + leaveEventType,function() {
            elemLeftIcon.fadeTo( "fast" , 1);
            if (elem.delayTimer)
                base.onReleased.call(base,elem);
        });
    },
    init: function () {
        var base = this;
        this.elements = $('div[data-type="'+this.widgetname+'"]');
        this.elements.each(function(index) {
            base.init_attr($(this));
            base.init_ui($(this));
        });
    },
    update: function (dev,par) {
        var base = this;
        // update from normal state reading
        this.elements.filterDeviceReading('get',dev,par)
        .each(function(index) {
            var elem = $(this);
            var state = elem.getReading('get').val;
            if (state) {
                var part = elem.data('get-value');
                var val = parseFloat(getPart(state, part));
                elem.data('value',val);
                base.drawLevel(elem);
            }
         });

        //extra reading for dynamic color of text
        base.elements.filterDeviceReading('text-color',dev,par)
        .each(function(idx) {
            var elem = $(this);
            var val = elem.getReading('text-color').val;
            if(val) {
                val = '#'+val.replace('#','');
                elem.find('.spinnerText').css( "color", val );
            }
        });
    },
});
