import React from "react";
import "./AdzuSnBanner.css";

const AdzuSnBanner = () => {
  return (
    <aside
      className="adzu-sn-banner"
      aria-label="ADZU Social Network sneak peek"
    >
      <span className="adzu-sn-banner__badge">Sneak peek</span>

      <div className="adzu-sn-banner__wordmark" aria-hidden="true">
        <span className="adzu-sn-banner__w adzu-sn-banner__w--adzu">ADZU.</span>
        <span className="adzu-sn-banner__w adzu-sn-banner__w--chat">CHAT.</span>
        <span className="adzu-sn-banner__w adzu-sn-banner__w--really">REALLY.</span>
      </div>

      <p className="adzu-sn-banner__kicker">Social Network</p>

      <p className="adzu-sn-banner__tagline">
        Campus only.<br />
        Stay anonymous.<br />
        Craft your own persona.<br />
        Voice your thoughts.
      </p>

      <p className="adzu-sn-banner__status">
        <span className="adzu-sn-banner__pulse" aria-hidden="true"></span>
        Coming soon
      </p>
    </aside>
  );
};

export default AdzuSnBanner;
