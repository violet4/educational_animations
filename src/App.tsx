import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { useGSAP } from '@gsap/react';
gsap.registerPlugin(TextPlugin);

// if it makes sense, we can convert UrlResource
// to a class to expose functions. or it can just
// stay as a simple data structure.
interface UrlResource {
  domain: string;
  path: string;
  type: string;
  ip: string;
  resource: string;
}

const resources: UrlResource[] = [
  { domain: 'images.com', path: '/cats.png', type: 'content', ip: '1.2.3.4', resource: '😺' },
  { domain: 'videos.com', path: '/puppies.mp4', type: 'content', ip: '1.2.3.5', resource: '🐶' },
  { domain: 'ads.com', path: '/tracking.js', type: 'tracking', ip: '6.6.6.1', resource: '🙄' },
  { domain: 'tracking.com', path: '/pixel.png', type: 'tracking', ip: '6.6.6.2', resource: '🤬' },
];

type IP = string;
type Domain = string;
type Path = string;
type Resource = string;


interface UsePositionTracker {
  elementRef: React.RefObject<HTMLDivElement>;
  visits: (rect: DOMRect|null, tl: gsap.core.Timeline) => void;
  getRect: () => DOMRect|null;
}

// const {elementRef, getPosition, visit} = usePositionTracker();
function usePositionTracker(): UsePositionTracker {
  const elementRef = useRef<HTMLDivElement>(null);

  const getRect = () => elementRef.current?.getBoundingClientRect() || null;

  const visits = (or: DOMRect|null, tl: gsap.core.Timeline) => {
    const ir = getRect();
    if (!elementRef.current || !ir || !or) return;
    const x = or.x + (or.width/2) - (ir.width/2);
    tl.add(() => {tl.to(elementRef.current, { x, duration: 2 });});
  };

  return { elementRef, visits, getRect };
}


const useWebpage = (resources: UrlResource[]) => {
  const {elementRef, getRect: getWebpageRect} = usePositionTracker();
  const domain_to_path: {[domain: Domain]: {[path: Path]: Resource}} = {};
  resources.forEach(r => {
    if (domain_to_path[r.domain] === undefined)
      domain_to_path[r.domain] = {};
    domain_to_path[r.domain][r.path] = r.resource;
  })
  const getWebpageDomains = () => {
    // how do we populate this with all the <td> elements that contain domains below?
    if (!elementRef.current) return [];
    const domainCells = Array.from(elementRef.current.querySelectorAll('tbody tr td:first-child'));
    return domainCells as HTMLElement[];
  };

  return {getWebpageRect, getWebpageDomains, renderWebpage: () => (
    <div ref={elementRef}>
      <center>
        <h2>Webpage</h2>
        <table>
          <thead>
            <tr>
              <th>Domain</th>
              <th>Path</th>
              <th>Resource</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(domain_to_path).map(([domain, path_to_resource]) =>
              Object.entries(path_to_resource).map(([path, resource]) => (
                <tr key={`${domain}${path}`}>
                  {/* this domain right here */}
                  <td style={{textAlign: 'right'}}>{domain}</td>
                  <td>{path}</td>
                  <td>{resource}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </center>
    </div>
  )};
};

// const {getPosition: getDNSPosition, visit: visitDNS, render: renderDNS} = useDNS();
const useDNS = (resources: UrlResource[]) => {
  const {elementRef, getRect: getDNSRect} = usePositionTracker();
  const domain_to_ip: {[domain: Domain]: IP} = {};
  resources.forEach(r => {
    domain_to_ip[r.domain] = r.ip;
  });

  const getDnsIps = (_: any) => {
    // how do we populate this with all the <td> elements that contain domains below?
    if (!elementRef.current) return [];
    const domainCells = Array.from(elementRef.current.querySelectorAll('tbody tr td td:first-child'));
    return domainCells as HTMLElement[];
  };
  return {getDNSRect, getDnsIps, renderDNS: () => (
    <div ref={elementRef}>
      <center>
        <h2>DNS</h2>
        <table>
          <thead>
            {Object.entries(domain_to_ip).map(([domain, ip]) => (
              <tr key={`${domain}${ip}`}>
                <td>{domain}</td>
                <td>{ip}</td>
              </tr>
            ))}
          </thead>
        </table>
      </center>
    </div>
  )};
};

const useInternet = (resources: UrlResource[]) => {
  const {elementRef, getRect: getInternetRect} = usePositionTracker();
  //               domain_dict        path_dict
  const ip_to_domain: {[ip: IP]: {[domain: Domain]: {[path: Path]: Resource}}} = {};
  resources.forEach(r => {
    var domain_to_path = ip_to_domain[r.ip];
    if (domain_to_path === undefined)
      domain_to_path = ip_to_domain[r.ip] = {};

    var path_to_resource = domain_to_path[r.domain];
    if (path_to_resource === undefined)
      path_to_resource = domain_to_path[r.domain] = {};

    path_to_resource[r.path] = r.resource;
  });

  return {getInternetRect, renderInternet: () => (
    <div ref={elementRef}>
      <center>
        <h2>Internet</h2>
        <table>
          <thead>
            <tr>
              <th>IP</th>
              <th>Domain</th>
              <th>Path</th>
              <th>Resource</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(ip_to_domain).map(([ip, domain_to_path]) => (
              Object.entries(domain_to_path).map(([domain, path_to_resource]) => (
                Object.entries(path_to_resource).map(([path, resource]) => (
                  <tr key={`${ip}${domain}${path}${resource}`}>
                    <td>{ip}</td>
                    <td style={{textAlign: 'right'}}>{domain}</td>
                    <td>{path}</td>
                    <td>{resource}</td>
                  </tr>
                ))
              ))
            ))}
          </tbody>
        </table>
      </center>
    </div>
  )};
};


const Flex = ({content, flex}: {content: React.ReactNode, flex?: number}) => {
  if (flex === undefined)
    flex = 1;
  return (
    <div style={{ flex, border: '1px solid #ccc' }}>
      {content}
    </div>
  );
};


const Flexbox = ({children}: {children: React.ReactNode}) => {
  return (
    <div style={{ display: 'flex', width: '100vw' }}>
      {children}
    </div>
  );
};


const useGSAPSpeedController = (animation: gsap.core.Timeline|null) => {
  const [speed, setSpeed] = useState(1);
  const animationRef = useRef(animation);

  const handleSpeedChange = (newSpeed: number) => {
    setSpeed(newSpeed);
    if (animationRef.current) {
      animationRef.current.timeScale(newSpeed);
    }
  };
  useEffect(() => {
    animationRef.current = animation;
  }, [animation]);

  return (
    <div className="p-8">
      <div className="mb-4">
        <label className="mr-2">Animation Speed:</label>
        <input
          type="range"
          min="0"
          max="3"
          step="0.1"
          value={speed}
          onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
          className="w-48"
        />
        <span className="ml-2">{speed}x</span>
      </div>
    </div>
  );
};

export const spy = (v: any) => {console.log(v); return v;};

class InfoItem {
  private element: HTMLElement;
  constructor(element: HTMLElement) {
    this.element = element;
    // visibility: 'hidden'
    gsap.set(element, { position: 'absolute' });
  }
  transfer(from_ele: HTMLElement, to_ele_fn: (() => HTMLElement|null), content: string, timeline: GSAPTimeline, vars: GSAPTweenVars) {
    const from = () => from_ele.getBoundingClientRect();
    const to = () => to_ele_fn()?.getBoundingClientRect();

    timeline.add(() => {timeline.set(this.element, {position: 'absolute', left: from()?.left, top: from()?.top, text: content, visibility: 'visible'});});

    timeline.add(() => {
      timeline.to(this.element, {
        onStart: () => {
          if (vars.onStart)
            vars.onStart();
          gsap.set(this.element, {position: 'absolute', left: () => from()?.left, top: () => from()?.top, text: content});
        },
        top: () => to()?.top || 0,
        left: () => to()?.left || 0,
        duration: 2,
        ...vars,
      });
    })
    // timeline.add(() => {
    //   const fromRect = from();
    //   timeline.set(this.element, { top: fromRect.top, left: fromRect.left, text: content});
    // });

    timeline.add(() => {timeline.set(this.element, {visibility: 'hidden'});});
  }
};




interface BrowserRow {
  domain: Domain;
  path: Path;
  ip: IP;
  resource: Resource;
};

const useBrowser = () => {
  const {visits: browserVisits, elementRef} = usePositionTracker();
  const [rows, setRows] = useState<BrowserRow[]>([]);

  const getLastRow = () => {
    return document.getElementById('end_domain_position') as HTMLElement;
  };

  const browserTrack = (ele: HTMLElement, ii: InfoItem|undefined, tl: GSAPTimeline) => {
    if (!ii || !elementRef.current) return;

    ii.transfer(ele, getLastRow, ele.innerHTML, tl, {
      onStart: () => {setRows(rows => [...rows, {domain: ele.innerText, path: '', ip: '', resource: ''}]);},
      onReverseComplete: () => {setRows((rows) => {const newRows = [...rows]; newRows.pop(); return newRows;});},
    });
  };

  const browserTrackDomain = (ele: HTMLElement, ii: InfoItem|undefined, tl: GSAPTimeline) => {
    if (!ii || !elementRef.current) return;

    ii.transfer(ele, getLastRow, ele.innerHTML, tl, {
      onComplete: () => {setRows(rows => [...rows, {domain: ele.innerText, path: '', ip: '', resource: ''}]);},
      onReverseComplete: () => {setRows((rows) => {const newRows = [...rows]; newRows.pop(); return newRows;});},
    });
  };
  const browserTrackIP = () => {};
  return {browserVisits, browserTrackDomain, browserTrackIP, renderBrowser: () => (
      <div ref={elementRef} style={{border: 'solid 1px red', width: 'fit-content'}}>
        <center>
          <h2>Web Browser</h2>
          <table>
            <thead>
              <tr>
                <th>Domain</th>
                <th>Path</th>
                <th>IP</th>
                <th>Resource</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r: BrowserRow, i: number) => (
                <tr key={`browser_row_${i}`}>
                  <td>{r.domain}</td>
                  <td>{r.path}</td>
                  <td>{r.ip}</td>
                  <td>{r.resource}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <table>
            <thead>
              <tr style={{visibility: 'hidden'}}>
                <th id="end_domain_position">Domain</th>
                <th>Path</th>
                <th>IP</th>
                <th>Resource</th>
              </tr>
            </thead>
          </table>
        </center>
      </div>
    )};
};


function App2() {
  const {renderDNS, getDNSRect, getDnsIps} = useDNS(resources);
  const {renderWebpage, getWebpageRect, getWebpageDomains} = useWebpage(resources);
  const {renderInternet, getInternetRect} = useInternet(resources);
  const {renderBrowser, browserVisits, browserTrackDomain, browserTrackIP} = useBrowser();

  const tlRef = useRef<gsap.core.Timeline|null>(null);
  const infoItemRef = useRef<HTMLDivElement>(null);
  const infoItem = useRef<InfoItem>();
  const speedController = useGSAPSpeedController(tlRef.current);

  useGSAP(() => {
    const tl = gsap.timeline({paused: true});
    if (infoItemRef.current)
      infoItem.current = new InfoItem(infoItemRef.current);
    tlRef.current = tl;

    // ScrollTrigger.refresh();

    browserVisits(getWebpageRect(), tl);
    // browserTrackDomain(getWebpageDomains(), infoItem.current, tl);
    getWebpageDomains().forEach((ele: HTMLElement, _, __) => {
      browserTrackDomain(ele, infoItem.current, tl);
    });

    // browser.extract_domains(tl, webpage);
    // webpage.
    // browser.extract_domains(tl, webpage);

    browserVisits(getDNSRect(), tl);
    getDnsIps(getWebpageDomains()).forEach((ele: HTMLElement, _, __) => {
      browserTrackIP(ele, infoItem.current, tl);
    });

    // browser.translate_domains(dns);
    // browserVisits(getWebpageRect(), tl);
    // browser.grab_urls(webpage);
    // browserVisits(getInternetRect(), tl);
    // browser.grab_resources(internet);
    // browserVisits(getWebpageRect(), tl);
    // browser.inject_resources(webpage);
    // tl.play();

    return () =>  {
      tl.kill();
      tlRef.current = null;
    }
  }, []);
  return (
    <div>
      <Flexbox>
        <Flex content={renderWebpage()} />
        <Flex content={renderDNS()} flex={0.5} />
        <Flex content={renderInternet()} />
      </Flexbox>
      {/* Type 'MutableRefObject<HTMLElement | undefined>' is not as */}
      <div ref={infoItemRef} style={{position: 'absolute'}} />
      {renderBrowser()}
      {speedController}
      <button onClick={() => tlRef.current && tlRef.current.restart()}>
        Play!</button>
      <button onClick={() => tlRef.current && tlRef.current.reverse()}>
        Reverse!</button>
      <input type="range" min={0} max={1} step={0.1} onChange={(e) => {tlRef.current?.play(); tlRef.current?.to(infoItemRef.current, {duration: 0.1, x: 1800*parseFloat(e.target.value)})}} />
    </div>
  );
}


const TableAnimation: React.FC = () => {
  const [destData, setDestData] = useState<string[]>([]);
  const animationRef = useRef<HTMLDivElement | null>(null);

  const handleAnimate = (item: string, fromElement: HTMLElement, toElement: HTMLElement) => {
    const fromRect = fromElement.getBoundingClientRect();
    const toRect = toElement.getBoundingClientRect();

    const animElement = animationRef.current!;
    animElement.textContent = item;
    animElement.style.position = "absolute";
    animElement.style.top = `${fromRect.top}px`;
    animElement.style.left = `${fromRect.left}px`;
    animElement.style.width = `${fromRect.width}px`;
    animElement.style.height = `${fromRect.height}px`;
    animElement.style.backgroundColor = "white";
    animElement.style.border = "1px solid black";

    gsap.set(animElement, {x: fromRect.x-fromRect.left, y: fromRect.y-fromRect.top});
    gsap.to(animElement, {
      x: toRect.left - fromRect.left,
      y: toRect.top - fromRect.top,
      duration: 1,
      onComplete: () => {
        setDestData((prev) => [...prev, item]);
      },
      onReverseComplete: () => {
        setDestData((prev) => {prev.pop(); return prev;})
      }
    });
    gsap.set(animElement, {autoAlpha: 1})
  };

  return (
    <div>
      <table>
        <tbody>
          <tr>
            {["A", "B", "C"].map((item, idx) => (
              <td
                key={idx}
                onClick={(e) => handleAnimate(item, e.currentTarget, document.getElementById(`dest-${idx}`)!)}
              >
                {item}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
      <div ref={animationRef} style={{ pointerEvents: "none" }} />
      <table>
        <tbody>
          <tr>
            {[0, 1, 2].map((idx) => (
              <td key={idx} id={`dest-${idx}`}>
                {destData[idx] || ""}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
};


interface DynamicTableProps<T extends object> {
  data: T[];
}

interface DynamicTableRef<T extends object> {
  getCells: (field: keyof T|null) => HTMLTableCellElement[];
  getData: () => T[];
  getCell: (rowIndex: number, columnName: keyof T) => HTMLTableCellElement | null;
}

const DynamicTable = React.forwardRef(<T extends object>(
  { data }: DynamicTableProps<T>,
  ref: React.ForwardedRef<DynamicTableRef<T>>
) => {
    const cellRefs = useRef<Map<string, HTMLTableCellElement>>(new Map());
    const columnRefs = useRef<Map<keyof T, HTMLTableCellElement[]>>(new Map());

    useImperativeHandle(ref, () => ({
      getCells: (field: keyof T|null=null) => {
        if (field === null)
          return Array.from(cellRefs.current.values())
        return columnRefs.current.get(field)||[];
      },
      getData: () => data,
      getCell: (rowIndex: number, columnName: keyof T) =>
        cellRefs.current.get(`${rowIndex}-${String(columnName)}`) || null
    }));

    if (!data.length) return null;
    const headers = Object.keys(data[0]);

    return (
      <table className="w-full border-collapse">
        <thead>
          <tr>
            {headers.map(header => (
              <th key={header} className="p-2 border">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {headers.map((header: string, _, __) => (
                <td
                  key={`${rowIndex}-${header}`}
                  ref={el => {
                    if (!el)
                      return;
                    cellRefs.current.set(`${rowIndex}-${header}`, el);
                    const h = header as keyof T;
                    if (!columnRefs.current.get(h))
                      columnRefs.current.set(h, []);
                    columnRefs.current.get(h)?.push(el);
                  }}
                  className="p-2 border"
                >
                  {String(row[header as keyof T])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  }
);


interface DynamicItemRef {
  setContent: (content: string) => void;
  getElement: () => HTMLDivElement;
}

const DynamicItem = React.forwardRef((
  {},
  ref: React.ForwardedRef<DynamicItemRef>
) => {
    const itemRef = useRef<HTMLDivElement>(null);
    const [content, setContent] = useState<string>('');

    useImperativeHandle(ref, () => ({
      setContent: (content: string) => setContent(content),
      getElement: () => {
        if (!itemRef.current) throw new Error("Ref not initialized");
        return itemRef.current;
      },
    }));

    return (
      <div ref={itemRef}>
        {content}
      </div>
    );
  }
);

function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
 return Array.from({ length: Math.min(arr1.length, arr2.length) },
   (_, i) => [arr1[i], arr2[i]]
 );
}

interface Fruit {
  Name: string;
  Color: string;
  Weight: number;
};

class GSAPState {
  private originalVars: GSAPTweenVars;
  private target: GSAPTweenTarget;

  constructor(target: GSAPTweenTarget, vars: GSAPTweenVars) {
    this.target = target;
    this.originalVars = Object.fromEntries(
      Object.keys(vars).map(key => [key, gsap.getProperty(target, key)])
    );
    gsap.set(target, vars);
  }

  dispose() {
    gsap.set(this.target, this.originalVars);
  }
}


const Demo = () => {
  gsap.registerPlugin();
  const fruit_data = [
    {Name: 'Apple', Color: 'red', Weight: 0.5},
    {Name: 'Banana', Color: 'yellow', Weight: 0.75},
  ];
  const table1Ref = useRef<DynamicTableRef<Fruit>>(null);
  const table2Ref = useRef<DynamicTableRef<Fruit>>(null);
  const itemRef = useRef<DynamicItemRef>(null);

  useGSAP(() => {
    if (!table1Ref.current || !table2Ref.current) return;
    const tl = gsap.timeline({paused: false});

    const getItem = () => itemRef.current?.getElement()||'';

    const transfer = (e1: HTMLElement, e2: HTMLElement, duration: number=1.5) => {
      tl.set(getItem(), {position: 'absolute', visibility: 'visible', text: e1.innerText, top: e1.getBoundingClientRect().top, left: e1.getBoundingClientRect().left});
      tl.to(getItem(), {duration, ease: 'circ.inOut', left: e2.getBoundingClientRect().left, top: e2.getBoundingClientRect().top});
      tl.set(getItem(), {visibility: 'hidden'});
      tl.set(e2, {visibility: 'visible'})
    };

    // setup
    ['Name', 'Color', 'Weight'].forEach((key: string) => {
      const k = key as keyof Fruit;
      table2Ref.current?.getCells(k).forEach((ele: HTMLElement) => {ele.style.visibility = 'hidden';});
    });

    // animate
    tl.delay(1);
    ['Name', 'Color', 'Weight'].forEach((key: string) => {
      const k = key as keyof Fruit;
      zip(table1Ref.current?.getCells(k)||[], table2Ref.current?.getCells(k)||[]).forEach(([e1, e2]) => {
        const state = new GSAPState(getItem(), { color: 'red' });
        transfer(e1, e2);
        state.dispose();
      })
    });


  }, []);
  return (
    <div>
      <DynamicTable ref={table1Ref} data={fruit_data} />
      <DynamicTable ref={table2Ref} data={fruit_data} />
      <DynamicItem ref={itemRef} />
    </div>
  );
};

function App() {
  // return <App2 />;
  return <Demo />;
}

export default App

