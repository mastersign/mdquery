# Intro

Sort by name

<!--
#data-list /Chapter */*
#sort-by name()
-->

Sort by name second level (sort stability test)

<!--
#data-list /Chapter */*/*
#sort-by name()
-->

Sort by value

<!--
#data-list /Chapter */A/*
#sort-by value()
-->

Multilevel sort with direction

<!--
#data-list /Chapter */*/*
#sort-by name(..)
#sort-by name(.): desc
#sort-by value(.): asc
-->

# Chapter 1 {#ch1}

Some text.
Which is an example for an arbitrary paragraph.

* B
    + 3: C
    + 3: A
    + 3: B
* A
    + 4: C
    + 2: B
    + 4: A

# Chapter 2 {#ch2}

* C
    + 1: A
    + 2: A
    + 3: A
