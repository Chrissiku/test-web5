import { Web5 } from "@web5/api/browser";
import { useEffect, useState } from "react";

const App = () => {
  const [web5, setWeb5] = useState("null");
  const [did, setDid] = useState("null");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initWeb5 = async () => {
      try {
        const { web5, did } = await Web5.connect();
        setWeb5(web5);
        setDid(did);
      } catch (error) {
        console.error("Error connecting to Web5", error);
      }
    };
    initWeb5();
  }, []);

  const protocolDef = {
    protocol: "https://social-media.xyz",
    published: true,
    types: {
      postSchema: {
        schema: "https://social-media.xyz/schemas/postSchema",
        dataFormats: ["applications/json"],
      },
    },
    structure: {
      postSchema: {
        $actions: [
          {
            who: "anyone",
            can: "read",
          },
          {
            who: "anyone",
            can: "write",
          },
        ],
      },
    },
  };

  const installProtocol = async () => {
    try {
      const { protocol, status } = await web5.dwn.protocols.configure({
        message: {
          definition: protocolDef,
        },
      });

      await protocol.send(did);
      if (status.code === 202) {
        console.log("Protocol Installed");
        setLoading(false);
      } else {
        console.log("Protocol not Installed", status.code);
      }
    } catch (error) {
      console.error("Error installing protocol : ", error);
    }
  };

  const createRecord = async () => {
    setLoading(true);
    try {
      const { record, status } = await web5.dwn.records.write({
        data: { name: "Tester", aga: 10 },
        message: {
          protocol: protocolDef.protocol,
          protocolPath: "postSchema",
          schema: protocolDef.types.postSchema.schema,
          recipient: did,
        },
      });

      await record.send(did);

      if (status.code === 200) {
        setLoading(false);
        console.log("Record created");
      }
    } catch (error) {
      console.error("Error creating Record", error);
    }
  };

  const ReadRecord = async () => {
    const response = await web5.dwn.records.query({
      from: did,
      message: {
        filter: {
          protocol: protocolDef.protocol,
          schema: protocolDef.types.postSchema.schema,
        },
      },
    });

    console.log(response);

    if (response.status.code === 200) {
      const result = await Promise.all(
        response.records.map(async (record) => {
          const data = await record.data.json();
          return {
            ...data,
            recordId: record.id,
          };
        })
      );
      console.log(result);
      return result;
    } else {
      console.error("Error fetching sent messages:", response.status);
      return [];
    }
  };

  if (web5 && did) {
    installProtocol();
  }

  return (
    <>
      {loading ? (
        <div>Loading ...</div>
      ) : (
        <>
          <h3>record.data.json() temporary fix</h3>
          <p>did {did}</p>
          <button onClick={() => createRecord()}>Create record</button>{" "}
          <button onClick={() => ReadRecord()}>Read record</button>
        </>
      )}
    </>
  );
};

export default App;
