# tabletotals
jquery functions to add totals/subtotals rows to tables

$('#mytable').tabletotals( { change: [0,1], total: [3], count:[4] } )

Adds subtotal rows after changes to column 0 or 1, where col 3 is the total of the previous rows and col 4 is the sum of the non-empty column 4s.
