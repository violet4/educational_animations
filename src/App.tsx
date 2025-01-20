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

interface DynamicItemProps {
  as?: keyof JSX.IntrinsicElements;
};

const DynamicItem = React.forwardRef((
  {as = 'div'}: DynamicItemProps,
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

    return React.createElement(as, {ref: itemRef}, content);
  }
);

function zip<T, U>(arr1: T[], arr2: U[]): [T, U][] {
 return Array.from({ length: Math.min(arr1.length, arr2.length) },
   (_, i) => [arr1[i], arr2[i]]
 );
}


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


const makeItemTransferFn = (tl: gsap.core.Timeline, getItem: () => GSAPTweenTarget) => {
  const transfer = (e1: HTMLElement, e2: HTMLElement, duration: number=1.5) => {
    tl.set(getItem(), {position: 'absolute', visibility: () => 'visible', text: e1.innerHTML, top: e1.getBoundingClientRect().top, left: e1.getBoundingClientRect().left});
    // circ.inOut
    tl.to(getItem(), {duration, ease: 'sine.inOut', left: e2.getBoundingClientRect().left, top: e2.getBoundingClientRect().top});
    // tl.set(getItem(), {visibility: 'hidden'});
    tl.set(e2, {visibility: 'visible'})
  };
  return transfer;
};


function hideCells<T extends object>(
  tableRef: DynamicTableRef<T>,
  columns?: (keyof T)[]
) {
  if (!tableRef) return;

  // If columns not provided, hide everything
  if (!columns || !columns.length) {
    const data = tableRef.getData();
    if (!data.length) return;
    columns = Object.keys(data[0]) as (keyof T)[];
  }

  columns.forEach((col) => {
    tableRef.getCells(col).forEach(cell => {
      cell.style.visibility = 'hidden';
    });
  });
}



const resources: UrlResource[] = [
  { domain: 'images.com', path: '/cats.png', type: 'content', ip: '1.2.3.4', resource: '😺' },
  { domain: 'videos.com', path: '/puppies.mp4', type: 'content', ip: '1.2.3.5', resource: '🐶' },
  { domain: 'ads.com', path: '/tracking.js', type: 'tracking', ip: '6.6.6.1', resource: '🙄' },
  { domain: 'tracking.com', path: '/pixel.png', type: 'tracking', ip: '6.6.6.2', resource: '🤬' },
];


const DNSAnimation = () => {
  gsap.registerPlugin();

  const dnsTableRef = useRef<DynamicTableRef<Partial<UrlResource>>>(null);
  const internetTableRef = useRef<DynamicTableRef<Partial<UrlResource>>>(null);
  const browserTableRef = useRef<DynamicTableRef<Partial<UrlResource>>>(null);
  const webpageTableRef = useRef<DynamicTableRef<Partial<UrlResource>>>(null);
  const itemRef = useRef<DynamicItemRef>(null);


  useGSAP(() => {
    if (!dnsTableRef.current || !internetTableRef.current
        || !browserTableRef.current || !webpageTableRef.current)
      return;
    const tl = gsap.timeline({paused: false});

    const getItem = () => itemRef.current?.getElement()||'';
    const transfer = makeItemTransferFn(tl, getItem);

    hideCells(browserTableRef.current, ['domain', 'ip', 'path', 'resource']);
    hideCells(webpageTableRef.current, ['resource']);

    // animate
    tl.delay(1);

    // browser takes domains from webpage
    zip(webpageTableRef.current?.getCells('domain')||[], browserTableRef.current?.getCells('domain')||[]).forEach(([e1, e2]) => {
      const state = new GSAPState(getItem(), { color: 'red' });
      transfer(e1, e2);
      state.dispose();
    })

    // browser takes IPs from DNS
    zip(dnsTableRef.current?.getCells('ip')||[], browserTableRef.current?.getCells('ip')||[]).forEach(([e1, e2]) => {
      const state = new GSAPState(getItem(), { color: 'red' });
      transfer(e1, e2);
      state.dispose();
    })

    // browser takes paths from webpage
    zip(webpageTableRef.current?.getCells('path')||[], browserTableRef.current?.getCells('path')||[]).forEach(([e1, e2]) => {
      const state = new GSAPState(getItem(), { color: 'red' });
      transfer(e1, e2);
      state.dispose();
    })

    // browser takes resources from internet
    zip(internetTableRef.current?.getCells('resource')||[], browserTableRef.current?.getCells('resource')||[]).forEach(([e1, e2]) => {
      transfer(e1, e2);
    })

    // browser populates webpage with resources
    zip(browserTableRef.current?.getCells('resource')||[], webpageTableRef.current?.getCells('resource')||[]).forEach(([e1, e2]) => {
      transfer(e1, e2);
    })

  }, []);

  return (
    <div>
      <Flexbox>
        <Flex content={<DynamicTable ref={webpageTableRef} data={resources.map((r: UrlResource) => ({domain: r.domain, path: r.path, resource: r.resource}))} />}/>
        <Flex content={<DynamicTable ref={dnsTableRef} data={resources.map((r: UrlResource) => ({domain: r.domain, ip: r.ip}))} />}/>
        <Flex content={<DynamicTable ref={internetTableRef} data={resources} />}/>
      </Flexbox>
      <table>
        <tbody>
          <tr>
            <DynamicItem ref={itemRef} as={'td'}/>
          </tr>
        </tbody>
      </table>
      <DynamicTable ref={browserTableRef} data={resources.map((r: UrlResource) => ({ip: r.ip, domain: r.domain, path: r.path, resource: r.resource}))} />
    </div>
  );
};



function App() {
  return <DNSAnimation />;
}

export default App

