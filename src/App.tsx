import React, { Component, createRef, ReactNode, RefObject, useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';
import { ScrollTrigger } from 'gsap/all';
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
    tl.to(elementRef.current, { x, duration: 2 });
  };

  return { elementRef, visits, getRect };
}


const useWebpage = (resources: UrlResource[]) => {
  const {elementRef, getRect: getWebpageRect} = usePositionTracker();
  const domain_to_path: {[domain: Domain]: {[path: Path]: Resource}} = {};
  resources.forEach(r => {
    if (domain_to_path[r.domain] === undefined)
      domain_to_path[r.domain] = {};
    domain_to_path[r.domain][r.path] = '';
  })

  return {getWebpageRect, renderWebpage: () => (
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
  return {getDNSRect, renderDNS: () => (
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
          min="-3"
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


class InfoItem {
  private element: HTMLElement;
  constructor(element: HTMLElement) {
    this.element = element;
    gsap.set(element, { opacity: 0, position: 'absolute' });
  }
  transfer(from: DOMRect, to: DOMRect, content: string, timeline: GSAPTimeline) {
    // set to from position and visible
    timeline.set(this.element, {visibility: 1, x: from.x, y: from.y, content: content})
    // animate to to position
    timeline.to(this.element, {x: to.x, y: to.y});
    // make invisible
    timeline.to(this.element, {visibility: 0});
  }
};


const useBrowser = () => {
  const {visits: browserVisits, elementRef} = usePositionTracker();
  return {browserVisits, renderBrowser: () => (
      <div ref={elementRef} style={{border: 'solid 1px red', width: 'fit-content'}}>
        <h2>Web Browser</h2>
      </div>
    )};
};


function App() {
  const {renderDNS, getDNSRect} = useDNS(resources);
  const {renderWebpage, getWebpageRect} = useWebpage(resources);
  const {renderInternet, getInternetRect} = useInternet(resources);
  const {renderBrowser, browserVisits} = useBrowser();

  const tlRef = useRef<gsap.core.Timeline|null>(null);
  const infoItemRef = useRef<HTMLDivElement>(null);
  const infoItem = useRef<InfoItem>();
  const speedController = useGSAPSpeedController(tlRef.current);

  useEffect(() => {
    const tl = gsap.timeline({paused: true});
    if (infoItemRef.current)
      infoItem.current = new InfoItem(infoItemRef.current);
    tlRef.current = tl;

    // ScrollTrigger.refresh();
    browserVisits(getWebpageRect(), tl);
    // browser.extract_domains(tl, webpage);
    // webpage.
    // browser.extract_domains(tl, webpage);

    browserVisits(getDNSRect(), tl);
    // browser.translate_domains(dns);
    browserVisits(getWebpageRect(), tl);
    // browser.grab_urls(webpage);
    browserVisits(getInternetRect(), tl);
    // browser.grab_resources(internet);
    browserVisits(getWebpageRect(), tl);
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
      <div ref={infoItemRef} />
      {renderBrowser()}
      {speedController}
      <button onClick={() => tlRef.current && tlRef.current.restart()}>
        Play!</button>
    </div>
  );
}

export default App

