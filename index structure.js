// structure attempt

//each probably in separate file
// ⚠️⚠️⚠️
// multiple page split makes things even more complicated here
// e.g. generate one print page at a time
// ⚠️⚠️⚠️
SVGRenderer {
    //... generate SVG
    //to use
    Designer
}
Designer {
    // all the spacing, settings, etc
    // from
    Paginator
}
Paginator {
    // split by calendar pages from the raw data
    // from
    Calendar
}
Calendar {
    // raw calendar _data_
    // ... dateFns
    // - [ ] Start refactoring from here probably 👈👈👈
}
FileSystem {
    // Write the file
    // might be worth separating the PDF generation too
    // from
    SVGRenderer
}
ArgsStuff {
    // collect all the parameters
    // to call
    FileSystem
}
main {
    // get inputs from command line
    ArgsStuff
}
main() // run