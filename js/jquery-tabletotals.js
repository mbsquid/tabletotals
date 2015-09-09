/*
 * 
 * TableTotals 
 * 
 */

/**
 * 
 * @description Add total/subtotal rows to an existing table
 * 
 * @example $('table').tabletotals( config );
 * @desc Create a simple way to add subtotals to a table
 * 
 * @example $('table').tabletotals( { subtotals: [ 
 *                                      { change: [1], count: [3], total: [2], rowCss: 'totalsCss' },
 *                                    ] } );
 * @desc Adds a subtotal row after any change to value in first or 2nd column
 *       and adds a subtotal row after any change the first column that
 *       counts column 4
 *       
 *      Apple   Golden   .75   true
 *      Apple   Red     1.2   false
 *      Apple   Pink    1.1   true
 *      Orange          2.3   true
 *      Pear    Bartlett 1.5  true
 *      Pear    Anjou   1.5   true
 *
 *
 *      Apple   Golden  .75   true
 *      Apple   Red     1.2   false
 *      Apple   Pink    1.1   true
 *      Apple           3.05  2
 *      Orange          2.3   true
 *      Orange          2.3   1
 *      Pear    Bartlett 1.5  true
 *      Pear    Anjou   1.5   true
 *      Pear            3.0   2
 *
 *      
 * 
 * @option subtotals: An array of objects describing each type of subtotal row to be added
 *          Attributes for each subtotal row are 
 *          change - array of columns that we watch for changes, subtotal inserted after any of these change
 *          total - sum these columns in the subtotal row
 *          count - count the (non-empty) rows for the subtotal
 *          rowCss - the css applied to subtotal rows
 *          valCss - thes css for each cell in subtotal rows
 * 
 * 
 * @option Boolean debug (optional) Boolean flag indicating if tabletotals
 *         should display debuging information usefull for development.
 * 
 * @type jQuery
 * 
 * @name tabletotals
 * 
 * @cat Plugins/Tabletotals
 * 
 */

(function ($) {

  $.fn.tabletotals = function ( opts ) {

    // Make a copy of config so noone can change it
    var settings = $.extend( {}, this.defaults, opts );

    return this.each( function() {
      $.tabletotals( this, settings );
    });

  }

  $.tabletotals = function( elm, settings ) {
    var e = $(elm)[0];
    if( e.tabletotals && settings && settings.action ) {
      if(settings.action == 'clear') e.tabletotals.clear();
      else if(settings.action == 'add') { 
        this.config = $.extend( $.fn.tabletotals.defaults, settings );
        e.tabletotals.add();
      }
    }
    else {
      e.tabletotals = new jQuery._tabletotals( e, settings ) ;
    }
    
    return e.tabletotals;
  };

  $._tabletotals = function( elm, settings ) {
    function log(s) {
      if (typeof console != "undefined" && typeof console.debug != "undefined") {
        console.log('tabletotals:' + s);
      } else {
        alert('tabletotals:'+ s);
      }
    }
    this.log = log;
    this.log('construct:' + JSON.stringify( settings ) );


    // Use defaults + settings to get config
    this.elm = elm
    this.config = $.extend( $.fn.tabletotals.defaults, settings );
    
    for( var i = 0; i < this.config.subtotals.length; i++ ) {
      this.config.subtotals[i] = $.extend( {}, $.fn.tabletotals.subtotalDefaults, this.config.subtotals[i] );
    };
    this.log( 'config:' + JSON.stringify( this.config ) );

    this.add();
  }

  $._tabletotals.prototype.clear = function() {
    $('tr.'+ this.config.rowCss, this.elm).remove();
  };
  $._tabletotals.prototype.add = function() {
    var thissubt = this;
    
    // Structure to hold current counts/values for each subtotal
    var counts = []; // one for each subtotal row
    thissubt.config.subtotals.forEach( function( val, ind, arr) {
      var count = {total: {}, count: {} };
      if(val.total) for( var i = 0; i < val.total.length; i++) {
        count.total[ val.total[i] ] = 0;
      }
      if(val.count) for(var i = 0;i < val.count.length; i++) {
        count.count[ val.count[i] ] = 0;
      }
      counts.push( count );
    });

    $('tbody tr', thissubt.elm).each( function() {
      var thistr = this;

      // Update counts to reflect thistr
      thissubt.config.subtotals.forEach( function( val, ind, arr ) {
        var count = counts[ind];
        if( val.total ) for( var i = 0; i < val.total.length; i++ ) {
          var txtval = $('td:nth-child(' + (val.total[i]+1) + ')', thistr).text();
          var value = 0;
          if( !isNaN( txtval ) ) value = parseInt( txtval );
          count.total[ val.total[i] ]  += value; 
        }
        if( val.count ) for( var i = 0; i < val.count.length; i++ ) {
          var txtval = $('td:nth-child(' + (val.count[i]+1) + ')', thistr).text();
          if( txtval && txtval != '' ) count.count[ val.count[i] ]++;
        }
      })

      var nexttr = thistr.nextSibling;

      // For each subtotal row defintion, see if we need to add it
      var aftertr = thistr;
      thissubt.config.subtotals.forEach( function( val, ind, arr ) {
        var subconfig = val;

        // Determine if 'change' columns have changed
        var changed = false;
        if( !nexttr ) changed= true;
        else {
          subconfig.change.forEach( function (v, i, a ) {
            var col = parseInt(v);
            var cur = $('td:nth-child(' + (col+1) + ')', thistr).text();
            var nxt = $('td:nth-child(' + (col+1) + ')', nexttr).text();
            if( cur != nxt) changed = true;
          });
        }

        if(changed) {
          // If changed, add subtotal row between thistr and nexttr
          var subrow = $('<tr>').addClass( thissubt.config.rowCss);
          if( subconfig.rowCss) subrow.addClass( subconfig.rowCss);
          for(var i = 0; i < thistr.childNodes.length; i++) {
            var td = $('<td>').addClass( thissubt.config.valCss);
            if( subconfig.valCss) td.addClass( subconfig.valCss);
            subrow.append( td );
          }
          subconfig.change.forEach( function( v, i, a ) {
            var col = parseInt( v );
            var cur = $('td:nth-child(' + (col+1) + ')', thistr).text();
            $('td:nth-child(' + (col+1) + ')', subrow).text( cur );
          });

          if(subconfig.total) subconfig.total.forEach( function( v, i, a ) {
            // Add to td and reset to zero
            var col = parseInt( v );
            $('td:nth-child(' + (col+1) + ')', subrow).text( counts[ind].total[ col ] );
            counts[ind].total[col] = 0;
          });
          if(subconfig.count) subconfig.count.forEach( function( v, i, a ) {
            // Add to td and reset to zero
            var col = parseInt(v);
            $('td:nth-child(' + (col+1) + ')', subrow).text( counts[ind].count[ col ] );
            counts[ind].count[col] = 0;
          });
          $(aftertr).after( subrow );
          aftertr = subrow;
        }
      });
    });
  };



  $.fn.tabletotals.defaults = {
      subtotals: [],
      debug: false,
      rowCss: 'subtotalRow',
      valCss: 'subtotalVal',
  };
  $.fn.tabletotals.subtotalDefaults = {
    rowCss: null,
    totalCss: null,
  };

      


})(jQuery);
