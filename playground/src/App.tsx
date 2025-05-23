import '@rexxars/react-json-inspector/json-inspector.css'

import {JsonInspector, type JsonInspectorProps} from '@rexxars/react-json-inspector'
import {
  decodeBase64,
  type EncodableObject,
  encodeBase64,
  encodeBase64Sha256,
  type Encoded,
  SetBuilder,
  SetSketch,
} from '@sanity/descriptors'
import {useCallback, useEffect, useMemo, useState} from 'react'

import schemaTypes from './schema'
import type {SchemaType} from './types'

const builder = new SetBuilder()
for (const {name, type, ...typeDef} of schemaTypes as SchemaType[]) {
  builder.addObject('sanity.schema.namedType', {name, typeDef: {...typeDef, subtypeOf: type}})
}

const registry = builder.build('sanity.schema.registry')

function DefCard({
  title,
  data,
  isExpanded,
}: {
  title: string
  data: unknown
  isExpanded?: JsonInspectorProps['isExpanded']
}) {
  return (
    <div className="bg-gray-100 border border-gray-400 px-2 py-2 my-4 max-w-[400px]">
      <div className="font-semibold mb-1">{title}</div>
      <JsonInspector data={data} search={false} isExpanded={isExpanded} />
    </div>
  )
}

type Message = {
  type: 'request' | 'response'
  content: Record<string, unknown>
}

function App(): React.ReactElement {
  const [stage, setStage] = useState<'initial' | 'request' | 'send-more' | 'done'>('initial')

  const [messages, setMessages] = useState<Message[]>([])

  const totalMessageSize = useMemo(
    () => messages.reduce((sum, msg) => sum + JSON.stringify(msg.content).length, 0),
    [messages],
  )

  useEffect(() => {
    if (messages.length > 1 && messages[0].content.id !== registry.set.id) {
      // The schema changed. Let's reset!
      setMessages([])
      setStage('initial')
    }
  }, [messages, stage, registry.set.id])

  const keys = getStoredDefs()
  const prev: {id: string; sketch: string} | null = localStorage['sdefprev']
    ? JSON.parse(localStorage['sdefprev'])
    : null

  const next = useCallback(() => {
    switch (stage) {
      case 'initial': {
        setMessages([{type: 'request', content: {id: registry.set.id}}])
        setStage('request')
        break
      }
      case 'request': {
        if (keys.includes(registry.set.id)) {
          setMessages([...messages, {type: 'response', content: {type: 'ok'}}])
          setStage('done')
        } else if (prev) {
          setMessages([
            ...messages,
            {type: 'response', content: {type: 'send-more', base: prev.id, sketch: prev.sketch}},
          ])
          setStage('send-more')
        } else {
          setMessages([...messages, {type: 'response', content: {type: 'send-more'}}])
          setStage('send-more')
        }

        break
      }
      case 'send-more': {
        let descriptors: null | Encoded<string, EncodableObject>[] = null
        let base: undefined | string
        let ourSketch: undefined | string

        if (prev && prev.id !== registry.set.id) {
          const sketch = new SetSketch(32, 8)
          decodeBase64(prev.sketch, sketch.arr)
          sketch.toggleAll(registry.sketch)
          const decoded = sketch.decode()
          if (decoded !== null) {
            localStorage[`sdef:${registry.set.id}`] = JSON.stringify(registry.set)
            descriptors = []
            base = prev.id
            ourSketch = encodeBase64(registry.sketch.arr)
            decoded.forEach((val) => {
              const id = encodeBase64Sha256(val)
              if (registry.set.keys.includes(id)) {
                descriptors!.push(registry.objectValues[id])
              }
            })
          }
        }

        if (descriptors === null) {
          descriptors = [registry.set, ...Object.values(registry.objectValues)]
        }

        for (const def of descriptors) {
          localStorage[`sdef:${def.id}`] = JSON.stringify(def)
        }

        localStorage['sdefprev'] = JSON.stringify({
          id: registry.set.id,
          sketch: encodeBase64(registry.sketch.arr),
        })

        setMessages([
          ...messages,
          {
            type: 'request',
            content: {id: registry.set.id, descriptors, base, sketch: ourSketch},
          },
        ])
        setStage('done')
      }
    }
  }, [keys, messages, prev, stage])

  const clear = useCallback(() => {
    for (const key of keys) {
      localStorage.removeItem(`sdef:${key}`)
    }
    localStorage.removeItem(`sdefprev`)
    window.location.reload()
  }, [])

  return (
    <div className="my-2 px-4">
      <div className="prose">
        <h1>Serialized Schema Synchronization</h1>
        <p>
          This is a demo which shows how the descriptor of a simplified schema format would look
          like and how we can efficiently synchronize it with the server.
        </p>
      </div>
      <div className="flex my-2">
        <div className="p-2 mx-4">
          <h2 className="font-bold text-2xl">Client schema</h2>
          <DefCard title="Registry" data={registry.set} />

          {Object.values(registry.objectValues).map((namedType) => (
            <DefCard
              key={namedType.id}
              title={`Type: ${namedType.name}`}
              data={namedType}
              isExpanded={(keyPath) => ['typeDef'].includes(keyPath)}
            />
          ))}
        </div>
        <div className="p-2 mx-4 w-[400px]">
          <div className="flex">
            <h2 className="font-bold text-2xl">Communication</h2>
            <div className="flex-1" />
            {stage !== 'done' && (
              <button className="border text-white bg-blue-400 px-4 py-1 rounded-md" onClick={next}>
                Next
              </button>
            )}
          </div>
          <div>
            <span className="font-semibold">{totalMessageSize}</span> bytes transferred
          </div>
          {messages.map((message, idx) => (
            <DefCard
              key={idx}
              title={message.type === 'request' ? 'Client -> Server' : 'Client <- Server'}
              data={message.content}
              isExpanded={() => true}
            />
          ))}
        </div>
        <div className="p-2 mx-4">
          <div className="flex">
            <h2 className="font-bold text-2xl">Server</h2>
            <div className="flex-1" />
            <button className="border text-white bg-blue-400 px-4 py-1 rounded-md" onClick={clear}>
              Clear
            </button>
          </div>
          <div className="max-w-[500px]">
            <p className="mb-4">
              {keys.length} descriptors on the server:{' '}
              {keys.map((id) => (
                <span key={id}>
                  <MonoSpan text={id} />{' '}
                </span>
              ))}
            </p>
            {prev && <DefCard title="Previously synced registry" data={prev} />}
          </div>
        </div>
      </div>
    </div>
  )
}

function MonoSpan({text}: {text: string}) {
  return (
    <span className="bg-gray-200 border border-gray-300 font-mono text-xs px-1 mx-1">{text}</span>
  )
}

function getStoredDefs(): string[] {
  const result: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)!
    if (key.startsWith('sdef:')) {
      result.push(key.slice(5))
    }
  }
  result.sort()
  return result
}

export default App
