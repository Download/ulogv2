module.exports = {
  ext: function(l) {
    console.info('level.ext', l)
    l.NONE = 0
    l.ALL = 9007199254740991 // Number.MAX_SAFE_INTEGER
    for (k in a.levels) l[k.toUpperCase()] = a.levels[k]
    a.createProperty(l, 'level', {
      // level number from string
      fromString: function(v) {
        return (v !== undefined) && (Number(v)!==Number(v) 
          ? a.levels[v.toLowerCase()] 
          : Number(v)
        )
      },
      // level number to string
      toString: function(v) {
        for (x in a.levels)
          if (a.levels[x] === v)
            return x.toUpperCase()
      },
      // getter extension
      get: function(l,v){
        return Math.max(a.enabled(l) && l.DEBUG || l.NONE, v)
      },
      // make properties on `ulog` itself read-only
      readOnly: l === ulog,
    })
  }
}
