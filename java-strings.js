import { java, make } from "./exercise-factories.js";

const topics = [];
const spec = (title, mission, goal, signature, body, tests, example) => ({
  title,
  mission,
  goal,
  signature,
  body,
  tests,
  example,
});
const pair = (topic, methods, first, second) =>
  topics.push({ topic, methods, questions: [first, second] });
const J = String.raw;

pair(
  "Whitespace & case",
  ["strip", "isBlank", "toLowerCase", "toUpperCase", "Locale.ROOT"],
  spec(
    "Normalize an imported login",
    "A customer import contains padded login names. The same login must normalize identically on servers with different default locales.",
    "Implement login(String value): reject null or blank input with IllegalArgumentException. Strip leading/trailing Java whitespace and lowercase with Locale.ROOT. Preserve internal whitespace. Use strip, isBlank and toLowerCase.",
    "public static String login(String value)",
    J`if(value==null || value.isBlank()) throw new IllegalArgumentException();
    return value.strip().toLowerCase(Locale.ROOT);`,
    J`expect(Main.login("  AfIF\t").equals("afif")); expect(Main.login("\u2003 USER \u2003").equals("user")); expect(Main.login(" A  B ").equals("a  b")); rejects(()->Main.login(null)); rejects(()->Main.login(" \t\n")); Locale previous=Locale.getDefault(); try{Locale.setDefault(Locale.forLanguageTag("tr-TR")); expect(Main.login(" I ").equals("i"));}finally{Locale.setDefault(previous);}`,
    '"  AfIF\\t" → "afif"',
  ),
  spec(
    "Standardize an equipment label",
    "Warehouse staff paste equipment labels with inconsistent capitalization and outer whitespace. Interior spacing carries meaning and must survive.",
    "Implement label(String value): reject null or blank input. Strip outer Java whitespace, uppercase with Locale.ROOT and preserve all interior characters. Use strip and toUpperCase. Validation failures must throw IllegalArgumentException.",
    "public static String label(String value)",
    J`if(value==null || value.isBlank()) throw new IllegalArgumentException();
    return value.strip().toUpperCase(Locale.ROOT);`,
    J`expect(Main.label("  rack-a ").equals("RACK-A")); expect(Main.label("\u2003 a  b \t").equals("A  B")); rejects(()->Main.label(null)); rejects(()->Main.label("\n\t")); Locale previous=Locale.getDefault(); try{Locale.setDefault(Locale.forLanguageTag("tr-TR"));expect(Main.label("id").equals("ID"));}finally{Locale.setDefault(previous);}`,
    '"  rack-a " → "RACK-A"',
  ),
);
pair(
  "Searching & indexes",
  ["indexOf", "lastIndexOf", "startsWith", "endsWith"],
  spec(
    "Count repeated markers",
    "An incident feed can contain overlapping markers. The operations dashboard must count every starting position, including overlaps.",
    "Implement occurrences(String text, String marker). Use indexOf to count overlapping, case-sensitive occurrences. Reject null arguments or an empty marker with IllegalArgumentException. An empty text or absent marker returns zero.",
    "public static int occurrences(String text, String marker)",
    J`if(text==null || marker==null || marker.isEmpty()) throw new IllegalArgumentException();
    int count=0, from=0, at;
    while((at=text.indexOf(marker,from))>=0){count++;from=at+1;}
    return count;`,
    J`expect(Main.occurrences("aaaa","aa")==3); expect(Main.occurrences("ababa","aba")==2); expect(Main.occurrences("abc","z")==0); expect(Main.occurrences("","x")==0); expect(Main.occurrences("aA","A")==1); rejects(()->Main.occurrences(null,"a")); rejects(()->Main.occurrences("a","")); rejects(()->Main.occurrences("a",null));`,
    '"aaaa", "aa" → 3',
  ),
  spec(
    "Recognize the final report extension",
    "The download service accepts CSV filenames, but hidden files, folder names and misleading compound extensions must not pass its filename check.",
    "Implement isCsv(String filename). Reject null. Using startsWith, endsWith and/or lastIndexOf, accept a case-insensitive final .csv extension with a nonempty base name. Reject names starting with '.', names containing '/' or '\\', and any trailing characters after the extension. Empty input returns false. Do not strip spaces.",
    "public static boolean isCsv(String filename)",
    J`if(filename==null) throw new IllegalArgumentException();
    if(filename.startsWith(".") || filename.indexOf('/')>=0 || filename.indexOf('\\')>=0) return false;
    return filename.lastIndexOf('.')>0 && filename.toLowerCase(Locale.ROOT).endsWith(".csv");`,
    J`expect(Main.isCsv("sales.CSV")); expect(Main.isCsv("report.v2.csv")); expect(!Main.isCsv(".csv")); expect(!Main.isCsv(".hidden.csv")); expect(!Main.isCsv("folder/a.csv")); expect(!Main.isCsv("folder\\a.csv")); expect(!Main.isCsv("a.csv.exe")); expect(!Main.isCsv("a.csv ")); expect(!Main.isCsv("")); rejects(()->Main.isCsv(null));`,
    '"sales.CSV" → true; "sales.csv.exe" → false',
  ),
);
pair(
  "Slicing & delimiters",
  ["substring", "indexOf", "lastIndexOf"],
  spec(
    "Read a value containing equals signs",
    "A configuration line starts with one key and '='. Its value may contain more equals signs, so splitting the entire line would corrupt it.",
    "Implement configValue(String line). Find the first '=' with indexOf, require a nonblank key before it, and return the substring after it with outer whitespace stripped. Allow an empty value. Reject null, no separator or a blank key with IllegalArgumentException.",
    "public static String configValue(String line)",
    J`if(line==null) throw new IllegalArgumentException();
    int at=line.indexOf('=');
    if(at<0 || line.substring(0,at).isBlank()) throw new IllegalArgumentException();
    return line.substring(at+1).strip();`,
    J`expect(Main.configValue("token = a=b=c ").equals("a=b=c")); expect(Main.configValue("empty=").equals("")); expect(Main.configValue(" x =  a  b ").equals("a  b")); rejects(()->Main.configValue("=x")); rejects(()->Main.configValue(" \t=x")); rejects(()->Main.configValue("missing")); rejects(()->Main.configValue(null));`,
    '"token = a=b=c " → "a=b=c"',
  ),
  spec(
    "Extract the final path component",
    "An export record stores a slash-separated location. The display needs only its final nonempty component, even when the location ends with several slashes.",
    "Implement basename(String path) with lastIndexOf and substring. Remove trailing '/' characters, then return the final component. Reject null or an empty input. Inputs consisting entirely of '/' return an empty string. Preserve spaces and do not resolve '.' or '..'.",
    "public static String basename(String path)",
    J`if(path==null || path.isEmpty()) throw new IllegalArgumentException();
    int end=path.length(); while(end>0 && path.charAt(end-1)=='/') end--;
    String clean=path.substring(0,end);
    return clean.substring(clean.lastIndexOf('/')+1);`,
    J`expect(Main.basename("/var/log/app.log///").equals("app.log")); expect(Main.basename("notes").equals("notes")); expect(Main.basename("///").equals("")); expect(Main.basename("/a/team notes/").equals("team notes")); expect(Main.basename("a/..").equals("..")); rejects(()->Main.basename("")); rejects(()->Main.basename(null));`,
    '"/var/log/app.log///" → "app.log"',
  ),
);
pair(
  "Literal replacement",
  ["replace", "substring", "contains"],
  spec(
    "Replace a literal search token",
    "A support tool replaces literal text selected by an operator. Dots, dollar signs and backslashes must be ordinary characters, never regex syntax.",
    "Implement replaceLiteral(String text, String target, String replacement) using String.replace. Reject null arguments and an empty target. Replace all non-overlapping literal matches; preserve the input when nothing matches. Neither target nor replacement is a regex.",
    "public static String replaceLiteral(String text, String target, String replacement)",
    J`if(text==null || target==null || replacement==null || target.isEmpty()) throw new IllegalArgumentException();
    return text.replace(target,replacement);`,
    J`expect(Main.replaceLiteral("v1.2.3",".","-").equals("v1-2-3")); expect(Main.replaceLiteral("x[x]","[","$1\\").equals("x$1\\x]")); expect(Main.replaceLiteral("aaaa","aa","b").equals("bb")); expect(Main.replaceLiteral("abc","x","").equals("abc")); expect(Main.replaceLiteral("","x","z").equals("")); rejects(()->Main.replaceLiteral("x","","y")); rejects(()->Main.replaceLiteral(null,"x","y")); rejects(()->Main.replaceLiteral("x",null,"y")); rejects(()->Main.replaceLiteral("x","y",null));`,
    '"v1.2.3", ".", "-" → "v1-2-3"',
  ),
  spec(
    "Fill a single template token",
    "An email template contains customer-name tokens. Only the first token belongs to the current message header; later tokens must remain untouched.",
    "Implement replaceFirstLiteral(String template, String token, String value). Reject null arguments or an empty token. Replace only the first literal occurrence, even when token/value contains regex metacharacters. Return the original contents if absent. Use indexOf and substring rather than an unescaped regex.",
    "public static String replaceFirstLiteral(String template, String token, String value)",
    J`if(template==null || token==null || value==null || token.isEmpty()) throw new IllegalArgumentException();
    int at=template.indexOf(token); if(at<0) return template;
    return template.substring(0,at)+value+template.substring(at+token.length());`,
    J`expect(Main.replaceFirstLiteral("Hi {{name}}; {{name}}","{{name}}","$5\\").equals("Hi $5\\; {{name}}")); expect(Main.replaceFirstLiteral("aaaa","aa","b").equals("baa")); expect(Main.replaceFirstLiteral("abc","x","q").equals("abc")); expect(Main.replaceFirstLiteral("","x","q").equals("")); rejects(()->Main.replaceFirstLiteral("a","","b")); rejects(()->Main.replaceFirstLiteral(null,"x","y")); rejects(()->Main.replaceFirstLiteral("x",null,"y")); rejects(()->Main.replaceFirstLiteral("x","y",null));`,
    '"Hi {{name}}; {{name}}", "{{name}}", "Afif" → "Hi Afif; {{name}}"',
  ),
);
pair(
  "Regex replacement",
  ["replaceAll", "replaceFirst", "Matcher.quoteReplacement"],
  spec(
    "Collapse noisy ASCII whitespace",
    "Machine-generated notes contain inconsistent ASCII spacing. Search indexing needs one ordinary space between words while keeping non-ASCII characters intact.",
    "Implement collapse(String text) using replaceAll. Replace runs of space, tab, LF, CR, form feed and vertical tab with one ordinary space; remove these ASCII whitespace characters at both ends. Preserve all other characters, including Unicode spaces. Reject null. Whitespace-only input returns an empty string.",
    "public static String collapse(String text)",
    J`if(text==null) throw new IllegalArgumentException();
    return text.replaceAll("^[ \\t\\n\\r\\f\\x0B]+|[ \\t\\n\\r\\f\\x0B]+$","").replaceAll("[ \\t\\n\\r\\f\\x0B]+"," ");`,
    J`expect(Main.collapse("  one\t\n two\rthree  ").equals("one two three")); expect(Main.collapse(" \t\n\r\f\u000B").equals("")); expect(Main.collapse("").equals("")); expect(Main.collapse("\u2003A\u2003").equals("\u2003A\u2003")); expect(Main.collapse("a\f\u000Bb").equals("a b")); rejects(()->Main.collapse(null));`,
    '"  one\\t two " → "one two"',
  ),
  spec(
    "Substitute one numeric token safely",
    "An operator replaces the first numeric reference in a note. The replacement is free text and may contain '$' or '\\', which regex replacement interprets specially unless quoted.",
    "Implement firstNumber(String text, String value) using replaceFirst and Matcher.quoteReplacement. Replace the first run of ASCII digits [0-9]+ with the literal value. Leave later numbers and text without digits unchanged. Reject null arguments.",
    "public static String firstNumber(String text, String value)",
    J`if(text==null || value==null) throw new IllegalArgumentException();
    return text.replaceFirst("[0-9]+",java.util.regex.Matcher.quoteReplacement(value));`,
    J`expect(Main.firstNumber("job 123, retry 4","$5\\").equals("job $5\\, retry 4")); expect(Main.firstNumber("12x34","").equals("x34")); expect(Main.firstNumber("none","x").equals("none")); expect(Main.firstNumber("", "x").equals("")); expect(Main.firstNumber("١2","X").equals("١X")); rejects(()->Main.firstNumber(null,"x")); rejects(()->Main.firstNumber("1",null));`,
    '"job 123, retry 4", "X" → "job X, retry 4"',
  ),
);
pair(
  "Splitting & joining",
  ["split", "Pattern.quote", "String.join"],
  spec(
    "Keep empty fields in an export",
    "A pipe-delimited export uses empty fields to represent missing values, including at the end. A default split silently drops useful information.",
    "Implement fields(String row) using split with a negative limit. Split on literal '|', preserve leading/interior/trailing empty fields, and return one empty field for an empty row. Reject null. This is delimiter splitting, not quoted CSV parsing.",
    "public static String[] fields(String row)",
    J`if(row==null) throw new IllegalArgumentException(); return row.split("\\|",-1);`,
    J`expect(Arrays.equals(Main.fields("a||c|"),new String[]{"a","","c",""})); expect(Arrays.equals(Main.fields("|"),new String[]{"",""})); expect(Arrays.equals(Main.fields(""),new String[]{""})); expect(Arrays.equals(Main.fields("one"),new String[]{"one"})); expect(Arrays.equals(Main.fields(" | "),new String[]{" "," "})); rejects(()->Main.fields(null));`,
    '"a||c|" → ["a", "", "c", ""]',
  ),
  spec(
    "Normalize a literal-delimited list",
    "A partner chooses its own list delimiter, including regex characters. Empty list entries should disappear, but the remaining names must keep their order and duplicates.",
    "Implement joinNames(String row, String delimiter). Reject null arguments or an empty delimiter. Split on the literal delimiter using Pattern.quote, strip each part, discard blank parts and join the remaining parts with ', '. Preserve order, duplicates and case. An empty result returns an empty string.",
    "public static String joinNames(String row, String delimiter)",
    J`if(row==null || delimiter==null || delimiter.isEmpty()) throw new IllegalArgumentException();
    List<String> names=new ArrayList<>();
    for(String part:row.split(java.util.regex.Pattern.quote(delimiter),-1)){String name=part.strip();if(!name.isBlank())names.add(name);}
    return String.join(", ",names);`,
    J`expect(Main.joinNames(" Afif.*.* Noor .*Afif ",".*").equals("Afif, Noor, Afif")); expect(Main.joinNames("a| b ||","|").equals("a, b")); expect(Main.joinNames("","|").equals("")); expect(Main.joinNames(" \t|\n","|").equals("")); expect(Main.joinNames("a\\b","\\").equals("a, b")); rejects(()->Main.joinNames("x","")); rejects(()->Main.joinNames(null,"|")); rejects(()->Main.joinNames("x",null));`,
    '" Afif | | Noor ", "|" → "Afif, Noor"',
  ),
);
pair(
  "StringBuilder edits",
  ["StringBuilder", "insert", "delete", "replace", "append"],
  spec(
    "Apply a bounded text edit",
    "A support agent selects one range of a draft and replaces it. A zero-width selection inserts text, while an empty replacement deletes it.",
    "Implement edit(String text, int start, int end, String replacement) using StringBuilder.replace. Use UTF-16 indexes with an inclusive start and exclusive end. Reject nulls, negative indexes, start greater than end, or end beyond text.length() with IllegalArgumentException. Do not alter text outside the selected range.",
    "public static String edit(String text, int start, int end, String replacement)",
    J`if(text==null || replacement==null || start<0 || end<start || end>text.length())throw new IllegalArgumentException();
    return new StringBuilder(text).replace(start,end,replacement).toString();`,
    J`expect(Main.edit("abcdef",2,4,"X").equals("abXef")); expect(Main.edit("abc",1,1,"!").equals("a!bc")); expect(Main.edit("abc",0,3,"").equals("")); expect(Main.edit("",0,0,"new").equals("new")); expect(Main.edit("abc",3,3,"!").equals("abc!")); rejects(()->Main.edit("abc",0,4,"x")); rejects(()->Main.edit("abc",2,1,"x")); rejects(()->Main.edit("abc",-1,0,"x")); rejects(()->Main.edit(null,0,0,"x")); rejects(()->Main.edit("a",0,0,null));`,
    '"abcdef", [2,4), "X" → "abXef"',
  ),
  spec(
    "Mask a support reference",
    "A support ticket must display only the last few characters of a reference. Everything before that suffix becomes '*', without changing the total UTF-16 length.",
    "Implement mask(String reference, int visible). Reject null or negative visible. If visible is at least reference.length(), return the original contents. Otherwise use a StringBuilder to replace each preceding UTF-16 char with '*'. visible=0 masks every char; empty input stays empty. Unicode code-point masking is not required in this task.",
    "public static String mask(String reference, int visible)",
    J`if(reference==null || visible<0)throw new IllegalArgumentException();
    StringBuilder result=new StringBuilder(reference);
    for(int i=0;i<reference.length()-visible;i++)result.setCharAt(i,'*');
    return result.toString();`,
    J`expect(Main.mask("AB123456",4).equals("****3456")); expect(Main.mask("abc",0).equals("***")); expect(Main.mask("abc",9).equals("abc")); expect(Main.mask("",0).equals("")); expect(Main.mask("a-b c",2).equals("*** c")); rejects(()->Main.mask(null,1)); rejects(()->Main.mask("a",-1));`,
    '"AB123456", 4 → "****3456"',
  ),
);
pair(
  "Formatting & padding",
  ["String.format", "Locale.ROOT", "repeat"],
  spec(
    "Format a stable diagnostic label",
    "Incident labels must look the same across server locales: a normalized service name followed by a zero-padded numeric sequence.",
    "Implement incident(String service, int number) using String.format with Locale.ROOT. Reject null/blank service and number outside 0..9999. Strip and lowercase service, then produce service-NNNN with exactly four digits. Preserve internal service characters.",
    "public static String incident(String service, int number)",
    J`if(service==null || service.isBlank() || number<0 || number>9999)throw new IllegalArgumentException();
    return String.format(Locale.ROOT,"%s-%04d",service.strip().toLowerCase(Locale.ROOT),number);`,
    J`expect(Main.incident(" API ",7).equals("api-0007")); expect(Main.incident("a",0).equals("a-0000")); expect(Main.incident("a",9999).equals("a-9999")); rejects(()->Main.incident("a",10000)); rejects(()->Main.incident("a",-1)); rejects(()->Main.incident(" ",1)); rejects(()->Main.incident(null,1)); Locale previous=Locale.getDefault();try{Locale.setDefault(Locale.forLanguageTag("ar-EG"));expect(Main.incident("ID",12).equals("id-0012"));}finally{Locale.setDefault(previous);}`,
    '" API ", 7 → "api-0007"',
  ),
  spec(
    "Pad a report column without truncation",
    "A plain-text report right-aligns values in fixed-width columns. Long values must remain intact, and padding must not grow without a defined limit.",
    "Implement padLeft(String text, int width) using repeat. Reject null or widths outside 0..200. Add ordinary spaces on the left until the result reaches width UTF-16 characters. Never truncate text already at least that long. An empty text is padded normally.",
    "public static String padLeft(String text, int width)",
    J`if(text==null || width<0 || width>200)throw new IllegalArgumentException();
    return " ".repeat(Math.max(0,width-text.length()))+text;`,
    J`expect(Main.padLeft("42",5).equals("   42")); expect(Main.padLeft("long",2).equals("long")); expect(Main.padLeft("",3).equals("   ")); expect(Main.padLeft("a",0).equals("a")); expect(Main.padLeft("",200).length()==200); rejects(()->Main.padLeft(null,3)); rejects(()->Main.padLeft("a",-1)); rejects(()->Main.padLeft("a",201));`,
    '"42", 5 → "   42"',
  ),
);
pair(
  "Comparison & matching",
  ["regionMatches", "equalsIgnoreCase", "startsWith"],
  spec(
    "Match a prefix without allocating a lowercase copy",
    "A protocol parser checks an ASCII-style prefix regardless of letter case. Changing the entire original string is unnecessary and may depend on a locale.",
    "Implement hasPrefix(String text, String prefix) using regionMatches with ignoreCase=true. Reject null arguments. Match only at index zero. An empty prefix matches any nonnull text; a longer prefix returns false. Use Java's regionMatches case rules, not locale-sensitive conversion.",
    "public static boolean hasPrefix(String text, String prefix)",
    J`if(text==null || prefix==null)throw new IllegalArgumentException();
    return text.regionMatches(true,0,prefix,0,prefix.length());`,
    J`expect(Main.hasPrefix("Bearer token","bearer ")); expect(!Main.hasPrefix("xBearer token","Bearer")); expect(Main.hasPrefix("abc","")); expect(Main.hasPrefix("","")); expect(!Main.hasPrefix("ab","ABC")); expect(!Main.hasPrefix("","a")); rejects(()->Main.hasPrefix(null,"a")); rejects(()->Main.hasPrefix("a",null));`,
    '"Bearer token", "bearer " → true',
  ),
  spec(
    "Compare normalized customer codes",
    "A reconciliation job receives codes with extra outer whitespace and mixed capitalization. Blank codes must not accidentally become valid identifiers.",
    "Implement sameCode(String left, String right). Reject null or blank arguments. Strip outer Java whitespace and compare with equalsIgnoreCase. Preserve internal spaces: 'A B' and 'AB' differ. Use Java's equalsIgnoreCase rules.",
    "public static boolean sameCode(String left, String right)",
    J`if(left==null || right==null || left.isBlank() || right.isBlank())throw new IllegalArgumentException();
    return left.strip().equalsIgnoreCase(right.strip());`,
    J`expect(Main.sameCode(" ab-1 ","AB-1")); expect(!Main.sameCode("A B","AB")); expect(!Main.sameCode("A","B")); expect(Main.sameCode("\u2003id","ID\t")); rejects(()->Main.sameCode(null,"x")); rejects(()->Main.sameCode("x",null)); rejects(()->Main.sameCode(" ","x")); rejects(()->Main.sameCode("x","\n"));`,
    '" ab-1 ", "AB-1" → true',
  ),
);
pair(
  "Unicode boundaries",
  [
    "codePointCount",
    "offsetByCodePoints",
    "substring",
    "StringBuilder.reverse",
  ],
  spec(
    "Truncate without splitting an emoji",
    "A notification preview uses a code-point limit rather than a UTF-16 char limit. Cutting through an emoji's surrogate pair would produce broken text.",
    "Implement takeCodePoints(String text, int maximum). Reject null or negative maximum. Return at most maximum Unicode code points using codePointCount, offsetByCodePoints and substring. Do not append an ellipsis. This counts code points, not grapheme clusters; combining marks count separately.",
    "public static String takeCodePoints(String text, int maximum)",
    J`if(text==null || maximum<0)throw new IllegalArgumentException();
    int count=Math.min(maximum,text.codePointCount(0,text.length()));
    return text.substring(0,text.offsetByCodePoints(0,count));`,
    J`expect(Main.takeCodePoints("A😀B",2).equals("A😀")); expect(Main.takeCodePoints("😀x",1).equals("😀")); expect(Main.takeCodePoints("abc",0).equals("")); expect(Main.takeCodePoints("",2).equals("")); expect(Main.takeCodePoints("abc",99).equals("abc")); expect(Main.takeCodePoints("e\u0301x",1).equals("e")); rejects(()->Main.takeCodePoints(null,1)); rejects(()->Main.takeCodePoints("a",-1));`,
    '"A😀B", 2 → "A😀"',
  ),
  spec(
    "Reverse text by code point",
    "A diagnostic tool reverses a short string. Supplementary characters must remain valid surrogate pairs, even though combining marks are not grouped into visual characters.",
    "Implement reverse(String text) using StringBuilder.reverse. Reject null. Reverse the code points of well-formed UTF-16 input, preserving supplementary characters. Empty input returns empty. Combining marks are reversed independently; do not implement grapheme-cluster reversal.",
    "public static String reverse(String text)",
    J`if(text==null)throw new IllegalArgumentException(); return new StringBuilder(text).reverse().toString();`,
    J`expect(Main.reverse("A😀B").equals("B😀A")); expect(Main.reverse("😀😃").equals("😃😀")); expect(Main.reverse("").equals("")); expect(Main.reverse("x").equals("x")); expect(Main.reverse("e\u0301").equals("\u0301e")); rejects(()->Main.reverse(null));`,
    'reverse("A😀B") → "B😀A"',
  ),
);
pair(
  "Lines & repeated text",
  ["lines", "strip", "String.join", "repeat"],
  spec(
    "Clean a multiline incident note",
    "Operators paste notes from Windows and Unix tools. The final note should contain only meaningful, stripped lines with consistent line separators.",
    "Implement cleanLines(String text) using lines, strip and String.join. Recognize LF, CR and CRLF as String.lines does. Strip each line, remove blank lines and join the remaining lines with LF, with no trailing LF. Reject null. Preserve interior whitespace within a retained line.",
    "public static String cleanLines(String text)",
    J`if(text==null)throw new IllegalArgumentException();
    List<String> lines=new ArrayList<>();text.lines().map(String::strip).filter(line->!line.isBlank()).forEach(lines::add);
    return String.join("\n",lines);`,
    J`expect(Main.cleanLines("  first \r\n\r\n second\rthird\n").equals("first\nsecond\nthird")); expect(Main.cleanLines("\n\t\r\n").equals("")); expect(Main.cleanLines("").equals("")); expect(Main.cleanLines(" a  b ").equals("a  b")); expect(Main.cleanLines("a\u2028b").equals("a\u2028b")); rejects(()->Main.cleanLines(null));`,
    '" first\\r\\n\\r\\n second " → "first\\nsecond"',
  ),
  spec(
    "Build a bounded repeated marker",
    "A terminal progress display needs a short repeated marker. An empty marker is legitimate, but unbounded repetition must be rejected before allocating output.",
    "Implement marker(String unit, int count). Reject null and counts outside 0..100. Use repeat to return unit repeated count times. For count zero or an empty unit, return an empty string. Preserve every character in unit.",
    "public static String marker(String unit, int count)",
    J`if(unit==null || count<0 || count>100)throw new IllegalArgumentException(); return unit.repeat(count);`,
    J`expect(Main.marker("=-",3).equals("=-=-=-")); expect(Main.marker("x",0).equals("")); expect(Main.marker("",100).equals("")); expect(Main.marker("😀",2).equals("😀😀")); expect(Main.marker("x",100).length()==100); rejects(()->Main.marker(null,1)); rejects(()->Main.marker("a",-1)); rejects(()->Main.marker("a",101));`,
    '"=-", 3 → "=-=-=-"',
  ),
);
pair(
  "Text processing capstones",
  ["strip", "split", "indexOf", "replaceAll", "String.join"],
  spec(
    "Canonicalize imported tags",
    "A search service receives comma-separated tags with inconsistent spacing and repeated names. Its canonical text must be stable across locales and repeated processing.",
    "Implement tags(String input). Reject null. Split on commas, strip each part, lowercase with Locale.ROOT, replace runs of ASCII whitespace with '-', discard empty tags and deduplicate while preserving first appearance. Join with commas and no extra spaces. Keep other characters unchanged. The result must be idempotent.",
    "public static String tags(String input)",
    J`if(input==null)throw new IllegalArgumentException();
    Set<String> tags=new LinkedHashSet<>();
    for(String part:input.split(",",-1)){String tag=part.strip().toLowerCase(Locale.ROOT).replaceAll("[ \\t\\n\\r\\f\\x0B]+","-");if(!tag.isEmpty())tags.add(tag);}
    return String.join(",",tags);`,
    J`expect(Main.tags(" Java , spring boot, JAVA,, Spring\tBoot ").equals("java,spring-boot")); expect(Main.tags(" b,a,b ").equals("b,a")); expect(Main.tags(" , , ").equals("")); expect(Main.tags("").equals("")); expect(Main.tags("c++,a.b").equals("c++,a.b")); String out=Main.tags(" A B,a b,C ");expect(Main.tags(out).equals(out)); Locale previous=Locale.getDefault();try{Locale.setDefault(Locale.forLanguageTag("tr-TR"));expect(Main.tags("I,i").equals("i"));}finally{Locale.setDefault(previous);} rejects(()->Main.tags(null));`,
    '" Java , spring boot, JAVA " → "java,spring-boot"',
  ),
  spec(
    "Redact selected query values",
    "An incident URL may contain a token or password. The redactor must replace only those parameter values while preserving parameter order, names and unrelated text exactly.",
    "Implement redactQuery(String query). Input is an undecoded query string without '?' or a fragment. Split on '&' while preserving empty parts; for each part, inspect the key before the first '='. If that key equals token or password ignoring case, replace everything after its first '=' with [REDACTED]. Preserve key spelling, separators, unrelated parameters and parts without '='. Reject null. Do not decode or trim anything.",
    "public static String redactQuery(String query)",
    J`if(query==null)throw new IllegalArgumentException();
    String[] parts=query.split("&",-1);
    for(int i=0;i<parts.length;i++){int at=parts[i].indexOf('=');if(at>=0){String key=parts[i].substring(0,at);if(key.equalsIgnoreCase("token")||key.equalsIgnoreCase("password"))parts[i]=key+"=[REDACTED]";}}
    return String.join("&",parts);`,
    J`expect(Main.redactQuery("a=1&TOKEN=a=b&password=&token&not_token=x&&").equals("a=1&TOKEN=[REDACTED]&password=[REDACTED]&token&not_token=x&&")); expect(Main.redactQuery("").equals("")); expect(Main.redactQuery("token=x&token=y").equals("token=[REDACTED]&token=[REDACTED]")); expect(Main.redactQuery(" token=x&%74oken=y").equals(" token=x&%74oken=y")); expect(Main.redactQuery("x=token=secret").equals("x=token=secret")); String redacted=Main.redactQuery("password=x");expect(Main.redactQuery(redacted).equals(redacted)); rejects(()->Main.redactQuery(null));`,
    '"a=1&TOKEN=a=b" → "a=1&TOKEN=[REDACTED]"',
  ),
);

export const javaStrings = make(
  "java-strings",
  "java",
  "Strings & text processing",
  "Progressive string coding missions: two exercises per topic, from method contracts to Unicode-safe processing and redaction.",
  ["String methods", "Text processing", "Java 21"],
  topics.flatMap(({ topic, methods, questions }, topicIndex) =>
    questions.map((question, i) => {
      const task = java(
        question.title,
        methods.join(", "),
        question.goal,
        question.signature,
        question.body,
        question.tests,
        `Practise ${methods.join(", ")}. Check boundaries and distinguish literal text from regex syntax.`,
      );
      task.verify = task.verify.replace(
        " static void expect",
        ' static void rejects(Runnable action) { try { action.run(); } catch(IllegalArgumentException e) { return; } throw new AssertionError("Expected IllegalArgumentException"); }\n static void expect',
      );
      return {
        ...task,
        title: `${topic} ${i + 1}/2 · ${question.title}`,
        mission: question.mission,
        goal: question.goal,
        requirements: [question.goal],
        example: question.example,
        learningGroup: "java-oop",
        section: "Strings & text processing",
        topic,
        questionNumber: i + 1,
        learn: methods,
        prerequisites:
          topicIndex || i
            ? [`hands-java-strings:${topicIndex * 2 + i - 1}`]
            : ["hands-java-oop-basics:0"],
        reuseNote:
          topicIndex === topics.length - 1
            ? "Combine the normalization, searching, splitting and joining techniques practised earlier."
            : "Apply the named String APIs; inputs include boundary cases and invalid values.",
      };
    }),
  ),
);
