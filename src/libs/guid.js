function Guid(r) {
	function t(r, t) {
		if(t = t.replace(/\{|\(|\)|\}|-/g, ""), t = t.toLowerCase(), 32 != t.length || -1 != t.search(/[^0-9,a-f]/i)) e(r);
		else
			for(var n = 0; n < t.length; n++) r.push(t[n])
	}

	function e(r) {
		for(var t = 32; t--;) r.push("0")
	}

	function n(r, t) {
		switch(t) {
			case "N":
				return r.toString().replace(/,/g, "");
			case "D":
				var e = r.slice(0, 8) + "-" + r.slice(8, 12) + "-" + r.slice(12, 16) + "-" + r.slice(16, 20) + "-" + r.slice(20, 32);
				return e = e.replace(/,/g, "");
			case "B":
				var e = n(r, "D");
				return e = "{" + e + "}";
			case "P":
				var e = n(r, "D");
				return e = "(" + e + ")";
			default:
				return new Guid
		}
	}
	var i = new Array;
	"string" == typeof r ? t(i, r) : e(i), this.Equals = function(r) {
		return r && r.IsGuid ? this.ToString() == r.ToString() : !1
	}, this.IsGuid = function() {}, this.ToString = function(r) {
		return "string" == typeof r && ("N" == r || "D" == r || "B" == r || "P" == r) ? n(i, r) : n(i, "D")
	}
}
Guid.Empty = new Guid, Guid.NewGuid = function() {
	for(var r = "", t = 32; t--;) r += Math.floor(16 * Math.random()).toString(16);
	return new Guid(r)
};
