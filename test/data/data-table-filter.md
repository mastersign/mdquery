# Intro

A filter by name:

<!--
#data-table /Chapter*/List */*
#column List: name(..)
#column Entry: name()
#column Value: value()
#filter name(): ?
-->

A filter by child:

<!--
#data-table /Chapter*/List *
#column List: name()
#column Entry: name(./*)
#column Value: value(./*)
#filter name(./*): ?
-->

A filter by parent:

<!--
#data-table /Chapter*/List */*
#column List: name(..)
#column Entry: name()
#column Value: value()
#filter name(..): List ?.?
-->

# Chapter 1 {#ch1}

Some text.
Which is an example for an arbitrary paragraph.

* List 1.1: ABC
* List 1.2: DEF
    + Entry 1.2.1: 121
    + Entry 1.2.2: 122
* List 1.3: GHI

# Chapter 2 {#ch2}

1. List 2.1 (first)
2. List 2.2 (second)
3. List 2.3 (third): 23
    * A: 231
    * B: 232

# Chapter 3

A paragraph only.
