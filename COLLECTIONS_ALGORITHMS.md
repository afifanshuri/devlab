# Collections and algorithms practice

100 additional Java 21 coding exercises cover 50 practical topics, with two challenges per topic. Existing exercises and saved IDs remain unchanged. Open **Collections & algorithms** in the library; the sections group API practice before algorithm applications. Suggested prerequisites connect related exercises within each section without locking access.

Each exercise has a scenario with a precise goal, sample input/output, learning objectives and acceptance criteria. Starters contain the required signatures and minimal supporting types only. Checks cover normal cases plus applicable empty inputs, duplicates, invalid values, ordering, mutation, snapshots, overflow and repeat calls.

## Scope and verification

This is a concrete core/intermediate coverage checklist, not a claim to exhaust every Java API or every known algorithm. Related operations recur in existing exercises. Specialized APIs such as weak-reference maps and legacy Vector/Hashtable/Stack are outside this practice set; prefer current List/Map/Deque abstractions for these tasks.

Costs describe the named operation or algorithm. End-to-end validation and copying may add linear work; construction costs must also be counted (for example, building a TreeSet costs O(n log n) before a logarithmic lookup). Capacity is distinct from size. Collection snapshots are shallow unless a task explicitly requires copying nested rows.

The runner compiles and executes saved answers against internal behavioral tests. It can verify results and observable ownership/mutation contracts, but passing does not prove a particular API was used, stability beyond the supplied cases, thread safety under every schedule, or asymptotic complexity. Follow the implementation constraints in the mission as well.

## Collection APIs: 31 topics, 62 exercises

### Array ranges and initialization

**Practise:** `Arrays.copyOf`, `Arrays.copyOfRange`, `Arrays.fill`, `Arrays.setAll`.

**When:** Use arrays for fixed-size indexed data; make explicit copies when ownership changes.

**Cost:** O(n) copying/initialization; O(1) indexed access.

- [Copy a bounded delivery window](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/0)
- [Prepare numbered slots with a reserved band](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/1)

### Array sorting and comparison

**Practise:** `Arrays.sort`, `Arrays.binarySearch`, `Arrays.equals`, `Arrays.mismatch`.

**When:** Use library sorting/searching for ordinary production work; search only data ordered by the same rule.

**Cost:** O(n log n) sort; O(log n) search; O(n) comparison.

- [Return the missing price's insertion point](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/2)
- [Find where two inventory versions diverge](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/3)

### ArrayList indexed editing

**Practise:** `ArrayList.add(int,E)`, `ArrayList.addAll`, `ArrayList.get`, `ArrayList.set`, `ArrayList.size`, `ArrayList.isEmpty`.

**When:** Choose ArrayList for frequent indexed reads and appends; middle inserts shift later elements.

**Cost:** O(1) get/set; amortized O(1) append; O(n) middle insert.

- [Insert a rush order without losing the queue](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/4)
- [Correct a slot, then append walk-ins](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/5)

### ArrayList removals and bulk filters

**Practise:** `ArrayList.remove(int)`, `ArrayList.remove(Object)`, `Collection.removeIf`, `Collection.removeAll`, `Collection.retainAll`.

**When:** Distinguish an element's value from its index, and apply bulk filters without unsafe iteration.

**Cost:** O(n) removals/filtering; avoid repeated middle removal for large lists.

- [Remove the order number, not the position](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/6)
- [Keep only valid pantry stock](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/7)

### ArrayList transformation and ordering

**Practise:** `List.replaceAll`, `List.sort`, `Comparator.comparingInt`, `Comparator.thenComparing`.

**When:** Transform a batch in place on an owned copy, then apply an explicit stable ordering rule.

**Cost:** O(n) transformation; O(n log n) sort.

- [Normalize and sort menu names](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/8)
- [Apply a bulk discount safely](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/9)

### ArrayList views, copies and capacity

**Practise:** `List.subList`, `List.clear`, `ArrayList.ensureCapacity`, `ArrayList.trimToSize`, `Collection.toArray`.

**When:** A subList is backed by its parent; copy it for detached pages. Capacity is allocation, not logical size.

**Cost:** O(k) page copy; O(n) middle-range removal; capacity changes do not add elements.

- [Remove one range and detach the page](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/10)
- [Reserve capacity without inventing bookings](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/11)

### LinkedList and ListIterator

**Practise:** `ListIterator.next`, `ListIterator.previous`, `ListIterator.add`, `ListIterator.set`, `ListIterator.remove`.

**When:** Use bidirectional iterators for cursor-local edits; avoid repeated indexed traversal of a linked list.

**Cost:** O(n) traversal; O(1) edits at an existing iterator position.

- [Edit tickets during a forward walk](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/12)
- [Read the newest notes backward](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/13)

### HashSet membership and set algebra

**Practise:** `HashSet.add`, `HashSet.contains`, `HashSet.remove`, `Set.addAll`, `Set.retainAll`, `Set.removeAll`.

**When:** Use hashed membership for uniqueness and unordered set operations, not sorted or stable iteration.

**Cost:** Expected O(1) membership; expected O(n+m) set operations.

- [Reconcile an equipment inventory](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/14)
- [Find shared and exclusive access](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/15)

### LinkedHashSet encounter order

**Practise:** `LinkedHashSet.add`, `SequencedSet.reversed`, `SequencedSet.removeFirst`.

**When:** Use a sequenced set for stable first-seen uniqueness, including Java 21 end access and reverse views.

**Cost:** Expected O(1) membership/end access; O(n) copy.

- [Keep recent unique arrivals in reverse order](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/16)
- [Dispatch from the oldest unique arrival](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/17)

### TreeSet navigation and ranges

**Practise:** `TreeSet.floor`, `TreeSet.ceiling`, `TreeSet.lower`, `TreeSet.higher`, `NavigableSet.subSet`, `NavigableSet.descendingSet`.

**When:** Use a sorted set for nearest-key and range queries; duplicates collapse.

**Cost:** O(log n) navigation; O(k+log n) range traversal.

- [Find the neighboring pickup slots](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/18)
- [Read a descending time range](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/19)

### EnumSet and EnumMap

**Practise:** `EnumSet.noneOf`, `EnumSet.allOf`, `EnumSet.complementOf`, `EnumMap.merge`.

**When:** Use enum-specialized collections when the key universe is a fixed enum, rather than arbitrary strings.

**Cost:** Small fixed-domain set operations; O(n) aggregation.

- [Find missing capabilities](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/20)
- [Count jobs by enum status](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/21)

### HashMap grouping and aggregation

**Practise:** `Map.computeIfAbsent`, `Map.merge`, `Map.getOrDefault`.

**When:** Use keyed lookup to group and accumulate records without repeatedly scanning prior results.

**Cost:** Expected O(n) aggregation; checked arithmetic for totals.

- [Group diners by their first letter](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/22)
- [Accumulate signed stock movements](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/23)

### Conditional map updates

**Practise:** `Map.compute`, `Map.replace(K,V,V)`.

**When:** Use conditional operations to express compare/update rules; ordinary HashMap is still not thread-safe.

**Cost:** Expected O(1) per HashMap lookup/update.

- [Apply a compare-and-replace status update](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/24)
- [Expire a counter when it reaches zero](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/25)

### Backed map views

**Practise:** `Map.entrySet`, `Map.keySet`, `Map.values`, `Map.Entry.setValue`, `Collection.removeIf`.

**When:** Map views write through to the backing map; copy when callers need a detached snapshot.

**Cost:** O(n) traversal; mutation applies to the original map.

- [Prune zero balances through a values view](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/26)
- [Rename every value without replacing the map](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/27)

### LinkedHashMap access order

**Practise:** `LinkedHashMap(accessOrder)`, `LinkedHashMap.get`, `LinkedHashMap.removeEldestEntry`.

**When:** Access-order maps track least-recently-used entries for a bounded local cache; insertion order alone is not LRU.

**Cost:** Expected O(1) get/put and eldest eviction.

- [Simulate a bounded LRU cache](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/28)
- [Separate insertion order from read order](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/29)

### TreeMap ranges and floor entries

**Practise:** `TreeMap.floorEntry`, `NavigableMap.subMap`, `NavigableMap.pollFirstEntry`.

**When:** Use ordered keys to find an effective version or process a bounded time range.

**Cost:** O(log n) floor/ceiling/update; O(k+log n) range read.

- [Resolve an effective price version](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/30)
- [Drain an inclusive schedule range](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/31)

### Queue admission and empty operations

**Practise:** `Queue.offer`, `Queue.poll`, `Queue.peek`.

**When:** Use FIFO queues for arrival-order work; choose null-returning operations when an empty queue is normal.

**Cost:** Amortized O(1) ArrayDeque offer/poll/peek.

- [Process only available capacity](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/32)
- [Inspect the next order without consuming it](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/33)

### Deque stack and end operations

**Practise:** `Deque.push`, `Deque.pop`, `Deque.peek`, `Deque.offerFirst`, `Deque.offerLast`, `Deque.pollFirst`, `Deque.pollLast`, `Deque.removeFirstOccurrence`.

**When:** Use one deque for stack behavior or explicit two-ended scheduling, with clearly defined ends.

**Cost:** Amortized O(1) end operations; O(n) occurrence removal.

- [Undo the newest actions](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/34)
- [Give an urgent order a new front position](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/35)

### PriorityQueue selection and merge

**Practise:** `PriorityQueue.offer`, `PriorityQueue.peek`, `PriorityQueue.poll`, `Comparator.comparingInt`.

**When:** Use a heap for repeated best-item selection; iterating a PriorityQueue does not produce sorted order.

**Cost:** O(n log k) top-k; O(n log k) merging k sorted lanes.

- [Keep the largest k sales](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/36)
- [Merge sorted delivery lanes](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/37)

### Comparator chains and null policy

**Practise:** `Comparator.comparingInt`, `Comparator.thenComparing`, `Comparator.nullsLast`, `Comparator.reversed`, `Integer.compare`.

**When:** Encode deterministic tie-breaking and null handling explicitly; subtraction-based comparators can overflow.

**Cost:** O(n log n) sort; O(1) primitive comparison.

- [Sort names with a deliberate null policy](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/38)
- [Order extreme priorities safely](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/39)

### Collections utility algorithms

**Practise:** `Collections.rotate`, `Collections.reverse`, `Collections.frequency`, `Collections.disjoint`.

**When:** Use tested library algorithms for standard list rearrangement and collection queries.

**Cost:** O(n) rearrangement and frequency/overlap scans with hash-set membership.

- [Rotate and reverse a duty roster](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/40)
- [Audit repeated and excluded attendees](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/41)

### Unmodifiable views versus snapshots

**Practise:** `Collections.unmodifiableList`, `List.copyOf`, `Arrays.asList`, `List.of`.

**When:** A read-only view can still change through another owner; use an independent copy for a stable snapshot.

**Cost:** O(1) wrapper; O(n) snapshot copy.

- [Return a live read-only view](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/42)
- [Freeze an independent menu snapshot](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/43)

### Generic producer and consumer bounds

**Practise:** `? extends T`, `? super T`, `Comparator<? super T>`, `List.addAll`.

**When:** Use extends for producers and super for consumers without unsafe casts or raw collections.

**Cost:** O(n) transfer/selection.

- [Copy specialized work into a general tray](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/44)
- [Select using a supertype comparator](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/45)

### Stream grouping and flattening

**Practise:** `Stream.flatMap`, `Collectors.partitioningBy`, `Collectors.toList`.

**When:** Use stream collectors for a clear transformation or report, while choosing ordering and mutability deliberately.

**Cost:** O(n) grouping/flattening, excluding any explicit sorting.

- [Flatten independent order lanes](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/46)
- [Partition pancake orders by a threshold](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/47)

### Optional and stream reductions

**Practise:** `Stream.filter`, `Stream.findFirst`, `Optional.orElseGet`, `IntSummaryStatistics`.

**When:** Use lazy fallback only when absence is normal; reductions need a valid identity and safe numeric type.

**Cost:** O(n) scan/reduction; fallback executes only when absent.

- [Load a default only when no order qualifies](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/48)
- [Summarize signed amounts without int overflow](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/49)

### Concurrent collection contracts

**Practise:** `ConcurrentHashMap.merge`, `CopyOnWriteArrayList.iterator`.

**When:** Use atomic map operations for concurrent updates and snapshot iterators for read-heavy collections; do not compose unsafe check-then-act sequences.

**Cost:** Expected O(n) counting work; copy-on-write mutation costs O(size).

- [Count competing requests exactly](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/50)
- [Read a copy-on-write snapshot](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/51)

### Bounded BlockingQueue operations

**Practise:** `ArrayBlockingQueue.offer`, `BlockingQueue.remainingCapacity`, `BlockingQueue.drainTo`.

**When:** Use bounded queues for backpressure; nonblocking offer reports rejection instead of waiting indefinitely.

**Cost:** O(1) offer/poll; O(k) bounded drain.

- [Report admission when the queue is full](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/52)
- [Drain a bounded batch from a live queue](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/53)


## Algorithms: 19 topics, 38 exercises

### Binary search variants

**Practise:** `Lower/upper bounds`, `Overflow-safe midpoint`, `Rotated sorted search`.

**When:** Use binary search when a sorted or monotone search space lets each decision discard half the candidates.

**Cost:** O(log n) search; input ordering is a stated precondition.

- [Locate the full run of duplicate values](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/0)
- [Search a rotated version index](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/1)

### Insertion and stable merge sort

**Practise:** `Insertion sort`, `Stable merge sort`, `Merge two sorted sequences`.

**When:** Insertion sort suits small/nearly sorted data; merge sort gives predictable O(n log n) behavior and stable tie handling.

**Cost:** Insertion O(n²), O(n) best case; merge O(n log n) time and O(n) auxiliary space.

- [Sort a small nearly ordered import](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/2)
- [Keep arrival order among equal-priority jobs](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/3)

### Partitioning and quickselect

**Practise:** `Three-way partition`, `Quickselect`, `Pivot selection`.

**When:** Partition around a pivot when only a rank or grouping is needed instead of a fully sorted result.

**Cost:** O(n) partition; expected O(n) quickselect, O(n²) worst case.

- [Partition priorities into three regions](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/4)
- [Select a percentile rank without sorting everything](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/5)

### Counting and radix sorting

**Practise:** `Counting sort`, `Stable radix passes`, `Bounded key ranges`.

**When:** Use non-comparison sorts when key range or digit structure makes their extra storage worthwhile.

**Cost:** Counting O(n+range); radix O(d·(n+base)); auxiliary storage is explicit.

- [Sort bounded score values](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/6)
- [Sort nonnegative identifiers by digit passes](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/7)

### Two-pointer scans

**Practise:** `Converging pointers`, `Read/write compaction`, `Long sum comparison`.

**When:** Exploit sorted order or one-pass compaction instead of nested scans or repeated middle removal.

**Cost:** O(n) time; O(1) auxiliary workspace for in-place compaction.

- [Find the first sorted pair totaling a target](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/8)
- [Compact sorted duplicates in place](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/9)

### Variable sliding windows

**Practise:** `Growing/shrinking window`, `Last-seen indexes`, `Positive-sum window`.

**When:** Use a moving window when its state can be updated incrementally instead of rebuilding each interval.

**Cost:** O(n) scans; each endpoint moves forward at most n times.

- [Find the longest run of distinct symbols](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/10)
- [Find the shortest qualifying sales burst](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/11)

### Prefix sums and difference arrays

**Practise:** `Long prefix sums`, `Half-open range queries`, `Difference array`.

**When:** Precompute cumulative state for repeated range queries or many batch interval updates.

**Cost:** O(n+q) total time, O(n) auxiliary space.

- [Answer many interval totals](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/12)
- [Apply many inclusive booking adjustments](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/13)

### Hash-based algorithm patterns

**Practise:** `Canonical grouping keys`, `Prefix-frequency map`, `Map.getOrDefault`, `Map.merge`.

**When:** Hash a useful invariant to find matching groups or prior states without a nested search.

**Cost:** Expected O(n) prefix counting; O(total characters) fixed-alphabet grouping.

- [Group anagrams in stable first-seen order](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/14)
- [Count signed subarrays reaching a target](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/15)

### Recursion and backtracking

**Practise:** `Choose/explore/unchoose`, `Duplicate pruning`, `Recursion base cases`.

**When:** Use backtracking to enumerate constrained possibilities, undoing local state after each branch.

**Cost:** Output-sensitive exponential/factorial work; small input bounds are deliberate.

- [Enumerate unique ingredient subsets](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/16)
- [Enumerate unique seating permutations](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/17)

### Linked-node algorithms

**Practise:** `Pointer reversal`, `Floyd cycle detection`, `Node identity`.

**When:** Operate on links directly when the structure is a node chain; Java LinkedList's public API does not expose its internal nodes.

**Cost:** O(n) time and O(1) extra workspace.

- [Reverse an owned node chain](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/18)
- [Detect a cycle without storing visited nodes](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/19)

### Binary-tree traversal and invariants

**Practise:** `BFS level order`, `DFS bounds`, `BST invariant`.

**When:** Use a queue for tree levels and inherited bounds to validate a BST; checking only parent-child pairs is insufficient.

**Cost:** O(n) time; O(width) BFS space or O(height) DFS stack.

- [Read a tree level by level](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/20)
- [Reject a deeply invalid search tree](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/21)

### Graph BFS and connected components

**Practise:** `Adjacency lists`, `BFS shortest hops`, `DFS components`, `Visited-state marking`.

**When:** Use BFS for shortest unweighted paths and a visited traversal to discover disconnected components.

**Cost:** O(V+E) time and space for adjacency lists and traversal state.

- [Find a minimum-hop service route](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/22)
- [Count isolated service clusters](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/23)

### Dependency ordering and weighted paths

**Practise:** `Kahn topological sort`, `Indegrees`, `Dijkstra`, `Heap stale-entry check`.

**When:** Topologically order a DAG's prerequisites; use Dijkstra for nonnegative weighted routes, not negative edges.

**Cost:** Topological sort O(V+E), or O((V+E) log V) with lexical ties; Dijkstra O((V+E) log V).

- [Schedule prerequisites deterministically](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/24)
- [Find weighted routes without int overflow](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/25)

### Union-find connectivity

**Practise:** `Parent arrays`, `Path compression`, `Union by size`, `Cycle detection`.

**When:** Maintain connectivity under incremental undirected unions without rerunning a complete graph traversal per update.

**Cost:** Amortized near-constant O(α(n)) per operation with path compression and size/rank.

- [Track cluster count after each connection](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/26)
- [Find the first redundant link](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/27)

### Dynamic programming

**Practise:** `State/transition/base case`, `Bottom-up coin change`, `LIS tails and lower bound`.

**When:** Reuse overlapping subproblem results; define impossible states and strict-versus-nonstrict transitions carefully.

**Cost:** Coin change O(amount·coins); LIS O(n log n).

- [Choose the fewest coins](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/28)
- [Find the longest strictly increasing subsequence](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/29)

### Greedy interval algorithms

**Practise:** `Sort by boundary`, `Merge intervals`, `Earliest-finish selection`.

**When:** Use the correct interval ordering for the goal; merging and maximizing a non-overlapping selection are different problems.

**Cost:** O(n log n) sorting plus O(n) scan.

- [Merge overlapping time ranges](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/30)
- [Schedule the most non-overlapping appointments](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/31)

### Bitwise algorithm patterns

**Practise:** `XOR cancellation`, `Integer.bitCount`, `Two's-complement integers`.

**When:** Use bit operations for flags and carefully specified parity invariants, not arbitrary duplicate-count assumptions.

**Cost:** O(1) 32-bit flag comparison; O(n) XOR reduction.

- [Count changed permission bits](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/32)
- [Recover the one odd-frequency identifier](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/33)

### Matrix traversal and rotation

**Practise:** `Boundary traversal`, `Rectangular shape validation`, `Coordinate transformation`.

**When:** Make row/column boundaries explicit to handle empty, single-row, single-column and rectangular grids correctly.

**Cost:** O(rows·columns) time; output uses O(rows·columns) space.

- [Read a grid in spiral order](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/34)
- [Rotate a rectangular export clockwise](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/35)


## Additional method and sorting contracts

### ArrayList lookup and membership

**Practise:** `List.indexOf`, `List.lastIndexOf`, `List.contains`, `Collection.containsAll`.

**When:** Use positional lookup when duplicates matter; use membership checks when positions do not matter. Repeated searches may justify a set or index.

**Cost:** O(n) positional lookup; containsAll can cost O(n*m) on lists.

- [Locate repeated orders](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/54)
- [Check ingredient coverage without counting stock](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/55)

### Map conditional presence and removal

**Practise:** `Map.computeIfPresent`, `Map.remove(K,V)`, `Map.putIfAbsent`.

**When:** Apply updates only to present mappings and avoid deleting a value that has changed since observation. HashMap operations do not provide cross-thread synchronization.

**Cost:** Expected O(1) per hash operation plus O(n) input validation.

- [Renew only registered reservations](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/56)
- [Release only the observed owner](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/57)

### Collections search and extrema

**Practise:** `Collections.min`, `Collections.max`, `Collections.binarySearch`, `Collections.swap`.

**When:** Use library extrema and binary search for well-defined ordering; swap two owned positions without a sorting pass.

**Cost:** O(n) extrema scans; O(log n) binary search on random-access lists; O(1) indexed swap on ArrayList.

- [Summarize and search a sorted price list](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/58)
- [Exchange two assigned slots](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/59)

### Queue exception contracts

**Practise:** `Queue.element`, `Queue.remove`, `Queue.peek`, `Queue.poll`.

**When:** Choose exception-throwing operations for required work and nullable operations when an empty queue is expected.

**Cost:** O(1) head operations on ArrayDeque, plus O(n) validation.

- [Inspect required work](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/60)
- [Claim required work](https://afifanshuri.github.io/devlab/#lab/hands-java-collection-methods/61)

### Heap sort and quicksort

**Practise:** `Max-heap construction`, `Sift down`, `Quicksort partitioning`, `Bounded recursion`.

**When:** Heap sort provides worst-case O(n log n) comparison sorting; quicksort partitions data with good locality but needs a deliberate pivot and recursion policy.

**Cost:** Heap sort O(n log n), O(1) auxiliary after copying; quicksort average O(n log n), worst O(n²), O(log n) stack when recursing only on the smaller partition.

- [Sort with a heap and no library sort](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/36)
- [Partition a comparison sort safely](https://afifanshuri.github.io/devlab/#lab/hands-java-algorithm-practice/37)

## Primary references

- [Java 21 ArrayList API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)
- [Java 21 Collections API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Collections.html)
- [Java 21 collection interfaces](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)
- [Java 21 concurrent collections](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/package-summary.html)
