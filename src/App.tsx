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



abstract class PositionTracker {
  protected elementRef: React.RefObject<HTMLDivElement>;

  constructor() {
    this.elementRef = React.createRef();
  }

  getX(): number {
    const rect = this.elementRef.current?.getBoundingClientRect();
    if (!rect) return 0;
    return rect.x + (rect.width / 2);
  }

  abstract render(): ReactNode;
}



class Webpage extends PositionTracker {
  domain_to_path: {[domain: Domain]: {[path: Path]: Resource}};

  constructor(resources: UrlResource[]) {
    super();
    this.domain_to_path = {};
    resources.forEach(r => {
      if (this.domain_to_path[r.domain] === undefined)
        this.domain_to_path[r.domain] = {};
      this.domain_to_path[r.domain][r.path] = '';
    })
  }
  render() {
    return (
      <div ref={this.elementRef}>
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
              {Object.entries(this.domain_to_path).map(([domain, path_to_resource]) =>
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
    );
  }
};

class DNS extends PositionTracker{
  domain_to_ip: {[domain: Domain]: IP};
  constructor(resources: UrlResource[]) {
    super();
    this.domain_to_ip = {};
    resources.forEach(r => {
      this.domain_to_ip[r.domain] = r.ip;
    })
  }
  render() {
    return (
      <div ref={this.elementRef}>
        <center>
          <h2>DNS</h2>
          <table>
            <thead>
              {Object.entries(this.domain_to_ip).map(([domain, ip]) => (
                <tr key={`${domain}${ip}`}>
                  <td>{domain}</td>
                  <td>{ip}</td>
                </tr>
              ))}
            </thead>
          </table>
        </center>
      </div>
    );
  }
};

class Internet extends PositionTracker {
  //               domain_dict        path_dict
  ip_to_domain: {[ip: IP]: {[domain: Domain]: {[path: Path]: Resource}}}
  constructor(resources: UrlResource[]) {
    super();
    this.ip_to_domain = {};
    resources.forEach(r => {
      var domain_to_path = this.ip_to_domain[r.ip];
      if (domain_to_path === undefined)
        domain_to_path = this.ip_to_domain[r.ip] = {};

      var path_to_resource = domain_to_path[r.domain];
      if (path_to_resource === undefined)
        path_to_resource = domain_to_path[r.domain] = {};

      path_to_resource[r.path] = r.resource;
    });
  }

  render() {
    return (
      <div ref={this.elementRef}>
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
              {Object.entries(this.ip_to_domain).map(([ip, domain_to_path]) => (
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
    );
  }
};

class Worker extends PositionTracker {
  visit(tl: gsap.core.Timeline, position_tracker: PositionTracker) {
    if (!this.elementRef.current)
      return;
    console.log(this.elementRef.current);
    const rect = this.elementRef.current.getBoundingClientRect();
    const width = rect.width / 2;
    console.log('width should be >0:', width)
    tl.to(this.elementRef.current, {x: position_tracker.getX() - width, duration: 2})
  }

  render() {
    return (
      <p ref={this.elementRef} style={{border: 'solid 1px red', width: 'fit-content'}}>
        <h2>Worker</h2>
        {(() => {console.log('Worker', this.elementRef.current?.getBoundingClientRect()); return <></>;})()}
      </p>
    );
  }
};


// website is a simple url,resource table. in all tables
// described here, each table is a key-value hash map, and each <td>
// should be a component that can be cloned, and
// the clone is animated to move to its new location where it will be copied
// to, in the destination table. if we need, we can make the special 'Item' component
// to make them easier to manipulate
const webpage = new Webpage(resources);

// DNS is a simple domain,ip table
const dns = new DNS(resources);

// internet is a ip,domain,url,content table
const internet = new Internet(resources);

// initializes a data structure represented as a table with columns for
// domain, ip, path, content, which will get populated as the worker
// travels around
// const worker = new Worker();

// webpage exposes its x location within the canvas,
// worker animates by updating its own x to match.
// this call signature is inspired by lifetime.to(thisworker, ...),
// since the worker knows about itself and therefore can easily do the lt.to call.
//const worker = new Worker();
//worker.visit(webpage);

// one of the following:
// webpage.urls.forEach(u => worker.record(u.domain));
// webpage.urls.forEach(url => worker.record_domain(url));
// worker.record_domains(webpage);

// animate
// worker.visit(dns);
// 


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
          min="0.1" 
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

function App() {
  const worker = new Worker();
  const tlRef = useRef<gsap.core.Timeline|null>(null);
  const speedController = useGSAPSpeedController(tlRef.current);


  useEffect(() => {
    console.log("components ready rendering")
    const tl = gsap.timeline({paused: true});
    tlRef.current = tl;

    requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      worker.visit(tl, webpage);
      // worker.extract_domains(webpage);

      worker.visit(tl, dns);
      // worker.translate_domains(dns);
      worker.visit(tl, webpage);
      worker.visit(tl, internet);
      worker.visit(tl, webpage);
      // tl.play();
    })

    return () =>  {
      tl.kill();
      tlRef.current = null;
    }
  }, []);
  return (
    <div>
      <Flexbox>
        <Flex content={webpage.render()} />
        <Flex content={dns.render()} flex={0.5} />
        <Flex content={internet.render()} />
      </Flexbox>
      {worker.render()}
      {speedController}
      <button onClick={() => tlRef.current && tlRef.current.play()}>Play!</button>
    </div>
  );
}

export default App

